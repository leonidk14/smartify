import Anthropic from "npm:@anthropic-ai/sdk@0.110.0";
import { requireEnv } from "../_shared/env.ts";
import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { buildTokenUsage, type TokenUsage } from "../_shared/usage.ts";
import { generateFresh } from "./generation.ts";
import { generateMock } from "./mock.ts";
import {
  addSentence,
  getSentences,
  incrementUsageCount,
  leastUsedIndex,
  SENTENCES_IN_CACHE_SIZE,
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

// TODO(auth): scope to the authenticated user once auth exists.
serveFunction(async (req) => {
  // POST, not GET like the sibling `lookup`: this endpoint writes on nearly
  // every call (bumps usageCount, or appends a generated sentence), and a
  // cached GET would replay a stale sentence and skip the increment.
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const providedKey = req.headers.get("x-lookup-key");
  if (!providedKey || providedKey !== requireEnv("LOOKUP_AUTH_KEY")) {
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

  // Mock output is never persisted — return it directly.
  if (Deno.env.get("GENERATE_MODE") !== "real") {
    const mock = await generateMock(key);
    return respond({ word: key, ...mock, source: "mock" });
  }

  const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("vocabulary")
    .select("groups")
    .eq("word", key)
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }

  const groups = (data?.groups ?? []) as StoredMeaningGroup[];
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

  // Unknown word or meaning — generate, but there is nowhere to cache it.
  if (!sentences) {
    const fresh = await generateFresh({
      client,
      word: key,
      meaning: meaningDefinition,
      meanings,
    });
    return respond({ word: key, ...fresh });
  }

  if (sentences.length < SENTENCES_IN_CACHE_SIZE) {
    const fresh = await generateFresh({
      client,
      word: key,
      meaning: meaningDefinition,
      meanings,
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
  const updatedGroups = incrementUsageCount({
    groups,
    meaningId,
    sentenceIndex,
  });
  await writeUpdatedWordGroups(updatedGroups);

  return respond({
    word: key,
    sentence: sentences[sentenceIndex].sentence,
    usage: buildTokenUsage({ inputTokens: 0, outputTokens: 0 }),
    source: "cache",
  });
});
