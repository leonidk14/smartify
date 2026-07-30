import Anthropic from "npm:@anthropic-ai/sdk@0.110.0";
import { getRequestUser } from "../_shared/auth.ts";
import { requireEnv } from "../_shared/env.ts";
import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { createUserClient } from "../_shared/supabase.ts";
import { buildTokenUsage, type TokenUsage } from "../_shared/usage.ts";
import { ensureOwnedWord } from "../_shared/vocabularyAccess.ts";
import {
  generateFresh,
  simplifySentence,
  type GenerationModel,
} from "./generation.ts";
import { generateMock } from "./mock.ts";
import {
  addSentence,
  getSentences,
  incrementUsageCount,
  leastUsedIndex,
  SENTENCES_IN_CACHE_SIZE,
  setSimplified,
  type GeneratedSentence,
  type StoredMeaningGroup,
} from "./sentenceCache.ts";

interface GenerateBody {
  word?: unknown;
  meaningId?: unknown;
  meaningDefinition?: unknown;
  meanings?: unknown;
}

function respond({
  word,
  sentence,
  usage,
  source,
}: {
  word: string;
  sentence: GeneratedSentence;
  usage: TokenUsage;
  source: string;
}): Response {
  console.log(
    `[generate-sentence] "${word}" (${source}) — in:${usage.inputTokens} out:${usage.outputTokens} cost:${usage.totalCost}`,
  );
  return jsonResponse({ sentence, usage, source });
}

serveFunction(async (req) => {
  // POST, not GET like the sibling `lookup`: this endpoint writes on nearly
  // every call (bumps usageCount, or appends a generated sentence), and a
  // cached GET would replay a stale sentence and skip the increment.
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { word, meaningId, meaningDefinition, meanings } = body;

  if (
    typeof word !== "string" ||
    !word.trim() ||
    typeof meaningId !== "string" ||
    !meaningId.trim() ||
    typeof meaningDefinition !== "string" ||
    !Array.isArray(meanings) ||
    meanings.some((m) => typeof m !== "string")
  ) {
    return errorResponse(
      "Expected { word: string, meaningId: string, meaningDefinition: string, meanings: string[] }",
    );
  }

  const key = word.trim().toLowerCase();

  // "real" runs the default Haiku→Sonnet flow; "sonnet"/"haiku" pin generation
  // to that single model. Any other value stays mock so the default never
  // spends tokens. Mock output is never persisted — return it directly.
  const generateMode = (Deno.env.get("GENERATE_MODE") ?? "").toLowerCase();
  if (
    generateMode !== "real" &&
    generateMode !== "sonnet" &&
    generateMode !== "haiku"
  ) {
    const mock = await generateMock(key);
    return respond({ word: key, ...mock, source: "mock" });
  }

  const generationModel: GenerationModel =
    generateMode === "sonnet"
      ? "sonnet"
      : generateMode === "haiku"
        ? "haiku"
        : "auto";

  const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  const supabase = createUserClient(req);

  // The sentence cache is written back into `groups`, so a caller practising a public
  // word gets their own fork of it rather than filling a shared row's cache.
  const owned = await ensureOwnedWord({ supabase, userId: user.id, word: key });

  if (owned === null) {
    console.warn(`[generate-sentence] "${key}" is not in the vocabulary`);
    return errorResponse(`Unknown word "${key}"`, 404);
  }

  const groups = owned.groups as StoredMeaningGroup[];
  const sentences = getSentences({ groups, meaningId });

  const writeUpdatedWordGroups = async (updated: StoredMeaningGroup[]) => {
    const { error: writeError } = await supabase
      .from("vocabulary")
      .update({ groups: updated })
      .eq("word", key);
    if (writeError) {
      throw new Error(writeError.message);
    }
  };

  if (!sentences) {
    console.warn(
      `[generate-sentence] "${key}" has no meaning "${meaningId}" — caller's vocabulary is stale`,
    );
    return errorResponse(`Unknown meaning "${meaningId}" for "${key}"`, 404);
  }

  if (sentences.length < SENTENCES_IN_CACHE_SIZE) {
    const fresh = await generateFresh({
      client,
      word: key,
      meaning: meaningDefinition,
      meanings,
      model: generationModel,
    });

    if (fresh.sentence.error) {
      return respond({ word: key, ...fresh });
    }

    const updatedGroups = addSentence({
      groups,
      meaningId,
      sentence: fresh.sentence,
    });
    await writeUpdatedWordGroups(updatedGroups);

    return respond({ word: key, ...fresh });
  }

  const sentenceIndex = leastUsedIndex(sentences);
  const cached = sentences[sentenceIndex].sentence;
  const counted = incrementUsageCount({ groups, meaningId, sentenceIndex });

  if (cached.simplified) {
    await writeUpdatedWordGroups(counted);

    return respond({
      word: key,
      sentence: cached,
      usage: buildTokenUsage({ inputTokens: 0, outputTokens: 0 }),
      source: "cache",
    });
  }

  const { simplified, usage } = await simplifySentence({
    client,
    word: key,
    meaning: meaningDefinition,
    original: cached.original,
  });
  await writeUpdatedWordGroups(
    setSimplified({ groups: counted, meaningId, sentenceIndex, simplified }),
  );

  return respond({
    word: key,
    sentence: { ...cached, simplified },
    usage,
    source: "cache+simplify",
  });
});
