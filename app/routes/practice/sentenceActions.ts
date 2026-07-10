import Anthropic from "@anthropic-ai/sdk";
import {
  buildTokenUsage,
  logTokenUsage,
  sumTokenUsage,
  type PricingModel,
} from "../wordSearch/usage";
import {
  DEFAULT_MOCK_EVALUATION,
  DEFAULT_MOCK_GENERATION,
  MOCK_EVALUATIONS,
  MOCK_GENERATIONS,
} from "./mocks";
import { readVocabulary, writeVocabulary } from "../wordSearch/vocabulary";
import type {
  CachedSentence,
  EvaluationResult,
  GeneratedSentence,
  SentenceEvaluation,
  SentenceGeneration,
  TokenUsage,
} from "./sentenceTypes";

const SENTENCES_IN_CACHE_SIZE = 3;

const USE_MOCK = true;

const GENERATION_SYSTEM_PROMPT = `You help English learners practice a target word. You are given a WORD, a REQUESTED meaning to practice, and a list of all MEANINGS available for that word.

Follow this order:
1. Find a genuine, confidently-attributable published quotation for the REQUESTED meaning.
2. If you cannot, fall back to another meaning from the MEANINGS list for which you can find one.
3. If — after a thorough search — NO meaning in the list yields a real quotation you are confident is genuine, WRITE your own natural example sentence for the REQUESTED meaning (or another meaning from the list), leave "source" empty, and set "generated" to true. Do NOT fabricate an attribution for an invented sentence.
Only use the "error" field if you cannot produce a sentence at all.

Always return a JSON object with ALL of these fields present:
1. "original": a short (ideally 10 words or fewer) sentence in which the WORD is used in the chosen MEANING. When "generated" is false, this must be a genuine quotation taken verbatim from REAL published material (journalism, a book, an essay, a famous speech) that you can confidently attribute — never invent, paraphrase, or approximate one. When "generated" is true, this is a natural sentence you wrote yourself. Either way, give the sentence text ONLY — do NOT wrap it in quotation marks and do NOT append the author or source here. On failure, set this to an empty string.
2. "source": when "generated" is false, the confident attribution — the author and work, or the publication, e.g. Kazuo Ishiguro, The Remains of the Day; it must be a real, specific source, never made up. When "generated" is true, set this to an empty string. On failure, set this to an empty string.
3. "simplified": a plain-language paraphrase of the sentence (without the attribution) that keeps the same idea but uses only simple, common words — AND does NOT contain the WORD or any obvious inflection of it. Replace the word with a plain description of its sense, so the learner can reinstate the word themselves. On failure, set this to an empty string.
4. "meaning": the exact meaning string you actually used, copied verbatim from the MEANINGS list (whether or not it matches the REQUESTED one). On failure, set this to an empty string.
5. "generated": true when you wrote the sentence yourself because no genuine quotation could be found; false when "original" is a real published quotation.
6. "error": on success, an empty string. Only when you cannot produce a sentence at all, a short plain explanation of why, with "original", "source", "simplified", and "meaning" all set to empty strings.

Rules:
- On success, all of "original", "source" (if present), and "simplified" convey the same situation and meaning.
- Real quotation: {"original": "...", "source": "...", "simplified": "...", "meaning": "...", "generated": false, "error": ""}
- Generated fallback: {"original": "...", "source": "", "simplified": "...", "meaning": "...", "generated": true, "error": ""}
- Failure: {"original": "", "source": "", "simplified": "", "meaning": "", "generated": false, "error": "..."}`;

const GENERATION_OUTPUT_FORMAT = {
  type: "json_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      original: { type: "string" },
      source: { type: "string" },
      simplified: { type: "string" },
      meaning: { type: "string" },
      generated: { type: "boolean" },
      error: { type: "string" },
    },
    required: [
      "original",
      "source",
      "simplified",
      "meaning",
      "generated",
      "error",
    ],
  },
} as const;

const EVALUATION_SYSTEM_PROMPT = `You grade how well an English learner used one specific target WORD inside a sentence. You are given the WORD, its MEANING, the reference ORIGINAL sentence, and the learner's SENTENCE.

You are grading the WORD, NOT the whole sentence. The score must reflect only:
- whether the WORD carries the given MEANING (the right sense, not a different meaning of the word), and
- whether the WORD sits naturally in its immediate context — correct collocations, the right preposition and form around it, register, and phrasing a native speaker would actually use for that word.

Do not ignore mistakes elsewhere in the sentence, but weight them lightly. A single unrelated grammar, spelling, or word-choice slip should barely move the score. Many such mistakes together should still pull it down — a sentence riddled with errors must not score near-perfect just because the WORD itself is fine. A surrounding error that makes the WORD read wrong counts fully against it.

Judge like an attentive native speaker reading naturally. Do NOT reward an exact match to the original — many different sentences use the word perfectly. Do NOT sugarcoat, and do NOT be pedantic about things a native speaker would not notice. But be strict about the word's smoothness: an awkward collocation, a wrong preposition or form next to the word, or a use that technically fits the definition but no native speaker would actually say should lower the score.

Return a score from 0 to 10 (one decimal) for the WORD's usage. Guidance: 9.5-10 = the word is used correctly and sounds completely natural; 7-9 = correct sense but the word sits slightly awkwardly; 4-6 = shaky or unnatural use of the word; 0-3 = wrong sense or the word does not work at all.

Always return a JSON object with ALL of "score", "correctedSentence", and "segments" present.

If the score is below 9.5, also return a minimally corrected version of the learner's sentence that keeps their intent in "correctedSentence". Fix the WORD's usage so it reads naturally, and also fix any clear mistakes elsewhere so they are flagged to the learner — but keep every edit minimal and do not restyle phrasing that is already acceptable. In "segments", express that corrected sentence as an ordered list whose "text" values concatenate (unchanged) to the full corrected sentence, with "changed": true on exactly the words or spans you adjusted (include surrounding whitespace and punctuation so concatenation is exact).

If the score is 9.5 or above, set "correctedSentence" to an empty string and "segments" to an empty array.

Never use double quotes inside a sentence — they break JSON.
Score 9.5 or above: {"score": 9.7, "correctedSentence": "", "segments": []}
Below 9.5: {"score": 7.5, "correctedSentence": "full corrected sentence", "segments": [{"text": "Her ", "changed": false}, {"text": "ephemeral", "changed": true}, {"text": " joy faded.", "changed": false}]}`;

const EVALUATION_OUTPUT_FORMAT = {
  type: "json_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      score: { type: "number" },
      correctedSentence: { type: "string" },
      segments: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            text: { type: "string" },
            changed: { type: "boolean" },
          },
          required: ["text", "changed"],
        },
      },
    },
    required: ["score", "correctedSentence", "segments"],
  },
} as const;

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// TODO: refactor and test this file, revisit the prompts on robustness

// Models with thinking enabled (e.g. Sonnet 5, which thinks by default) put
// thinking blocks before the text block, so the JSON is not always content[0].
function extractText(content: Anthropic.Messages.ContentBlock[]): string {
  const block = content.find(
    (b): b is Anthropic.Messages.TextBlock => b.type === "text",
  );
  if (!block) {
    throw new Error("Unexpected response type from API");
  }
  return block.text;
}

function parseGenerationResponse(text: string): GeneratedSentence {
  const parsed = JSON.parse(stripFences(text));

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Response is not a JSON object");
  }

  const { original, source, simplified, meaning, generated, error } =
    parsed as {
      original?: unknown;
      source?: unknown;
      simplified?: unknown;
      meaning?: unknown;
      generated?: unknown;
      error?: unknown;
    };

  if (typeof error === "string" && error.trim()) {
    return { original: "", source: "", simplified: "", error };
  }

  if (typeof original !== "string" || typeof simplified !== "string") {
    throw new Error('Response missing "original" or "simplified" string');
  }

  return {
    original,
    source: typeof source === "string" ? source : "",
    simplified,
    ...(typeof meaning === "string" && meaning.trim() ? { meaning } : {}),
    ...(generated === true ? { generated: true } : {}),
  };
}

function parseEvaluationResponse(text: string): SentenceEvaluation {
  const parsed = JSON.parse(stripFences(text));

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Response is not a JSON object");
  }

  const { score, correctedSentence, segments } = parsed as {
    score?: unknown;
    correctedSentence?: unknown;
    segments?: unknown;
  };

  if (typeof score !== "number" || Number.isNaN(score)) {
    throw new Error('Response missing "score" number');
  }

  const result: SentenceEvaluation = { score };

  if (typeof correctedSentence === "string" && correctedSentence.trim()) {
    result.correctedSentence = correctedSentence;
  }

  if (Array.isArray(segments) && segments.length > 0) {
    result.segments = segments.map((segment) => {
      if (
        typeof segment?.text !== "string" ||
        typeof segment?.changed !== "boolean"
      ) {
        throw new Error('Segment missing "text" string or "changed" boolean');
      }
      return { text: segment.text, changed: segment.changed };
    });
  }

  return result;
}

const GENERATION_MODELS: Record<
  PricingModel,
  { id: string; maxTokens: number }
> = {
  haiku: { id: "claude-haiku-4-5-20251001", maxTokens: 1024 },
  // Sonnet 5 thinks by default, so give the output extra headroom.
  sonnet: { id: "claude-sonnet-5", maxTokens: 1536 },
};

async function runGeneration({
  client,
  pricing,
  userContent,
}: {
  client: Anthropic;
  pricing: PricingModel;
  userContent: string;
}): Promise<SentenceGeneration> {
  const { id, maxTokens } = GENERATION_MODELS[pricing];
  const response = await client.messages.create({
    model: id,
    max_tokens: maxTokens,
    system: GENERATION_SYSTEM_PROMPT,
    output_config: { format: GENERATION_OUTPUT_FORMAT },
    messages: [{ role: "user", content: userContent }],
  });

  const sentence = parseGenerationResponse(extractText(response.content));
  const usage = buildTokenUsage({
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model: pricing,
  });

  return { sentence, usage };
}

// Produce a brand-new sentence from the model (real API path). Kept separate
// from the cache orchestration in `generateSentence`.
async function generateFresh({
  word,
  meaning,
  meanings,
}: {
  word: string;
  meaning: string;
  meanings: string[];
}): Promise<SentenceGeneration> {
  // TODO(anthropic-proxy): in SPA mode there is no server at runtime. Call the
  // Supabase Edge Function (POST .../functions/v1/generate) via fetch instead of
  // the Anthropic SDK, so ANTHROPIC_API_KEY stays server-side.
  // const client = new Anthropic();

  // const meaningsList = meanings.map((m) => `- ${m}`).join("\n");
  // const userContent = `Word: ${word}\nRequested meaning: ${meaning}\nMeanings:\n${meaningsList}`;

  // // First attempt with Haiku (cheaper/faster). Escalate to Sonnet only if
  // // Haiku gives up (returns the "error" field).
  // const haiku = await runGeneration({ client, pricing: "haiku", userContent });

  // if (!haiku.sentence.error) {
  //   logTokenUsage({ usage: haiku.usage, label: `generate (haiku): ${word}` });
  //   return haiku;
  // }

  // console.warn(
  //   `Haiku could not generate for "${word}", retrying with Sonnet:`,
  //   haiku.sentence.error,
  // );

  // const sonnet = await runGeneration({ client, pricing: "sonnet", userContent });
  // const usage = sumTokenUsage(haiku.usage, sonnet.usage);
  // logTokenUsage({ usage, label: `generate (haiku+sonnet): ${word}` });

  // return { sentence: sonnet.sentence, usage };
  return {
    sentence: [] as unknown as GeneratedSentence,
    usage: {} as unknown as TokenUsage,
  };
}

async function generateMock(word: string): Promise<SentenceGeneration> {
  const delay = 500 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const result = MOCK_GENERATIONS[word] ?? DEFAULT_MOCK_GENERATION;
  logTokenUsage({ usage: result.usage, label: `generate (mock): ${word}` });
  return result;
}

function findSentenceCache({
  store,
  word,
  meaningId,
}: {
  store: Awaited<ReturnType<typeof readVocabulary>>;
  word: string;
  meaningId: string;
}): CachedSentence[] | undefined {
  const entry = store[word];
  if (!entry) return undefined;

  for (const group of entry.groups) {
    const target = group.meanings[meaningId];
    if (target) {
      target.sentences ??= [];
      return target.sentences;
    }
  }
  return undefined;
}

export async function generateSentence({
  word,
  meaningId,
  meaningDefinition,
  meanings,
}: {
  word: string;
  meaningId: string;
  meaningDefinition: string;
  meanings: string[];
}): Promise<SentenceGeneration> {
  // Mock output is never persisted — return it directly.
  if (USE_MOCK) {
    return generateMock(word);
  }

  const store = await readVocabulary();
  const cachedSentences = findSentenceCache({ store, word, meaningId });

  if (!cachedSentences) {
    return generateFresh({ word, meaning: meaningDefinition, meanings });
  }

  if (cachedSentences.length < SENTENCES_IN_CACHE_SIZE) {
    const fresh = await generateFresh({
      word,
      meaning: meaningDefinition,
      meanings,
    });

    if (fresh.sentence.error) {
      return fresh;
    }

    cachedSentences.push({ sentence: fresh.sentence, usageCount: 1 });
    await writeVocabulary(store);
    return fresh;
  }

  let chosen = cachedSentences[0];
  for (const candidate of cachedSentences) {
    if (candidate.usageCount < chosen.usageCount) {
      chosen = candidate;
    }
  }
  chosen.usageCount += 1;
  await writeVocabulary(store);

  const usage = buildTokenUsage({ inputTokens: 0, outputTokens: 0 });
  logTokenUsage({ usage, label: `generate (cache): ${word}` });
  return { sentence: chosen.sentence, usage };
}

export async function evaluateSentence({
  word,
  meaning,
  original,
  userSentence,
}: {
  word: string;
  meaning: string;
  original: string;
  userSentence: string;
}): Promise<EvaluationResult> {
  // ── Real API call (commented out; using mocks from ./mocks) ──────────────
  // TODO(anthropic-proxy): call the Supabase Edge Function
  // (POST .../functions/v1/evaluate) via fetch instead of the Anthropic SDK,
  // so ANTHROPIC_API_KEY stays server-side.
  // const client = new Anthropic();

  // const response = await client.messages.create({
  //   model: "claude-haiku-4-5-20251001",
  //   max_tokens: 2024,
  //   system: EVALUATION_SYSTEM_PROMPT,
  //   output_config: { format: EVALUATION_OUTPUT_FORMAT },
  //   messages: [
  //     {
  //       role: "user",
  //       content: `Word: ${word}\nMeaning: ${meaning}\nOriginal: ${original}\nLearner sentence: ${userSentence}`,
  //     },
  //   ],
  // });

  // const evaluation = parseEvaluationResponse(extractText(response.content));
  // const usage = buildTokenUsage({
  //   inputTokens: response.usage.input_tokens,
  //   outputTokens: response.usage.output_tokens,
  // });
  // logTokenUsage({ usage, label: `evaluate: ${word}` });

  // return { evaluation, usage };

  // ── Mock mode ────────────────────────────────────────────────────────────
  const delay = 500 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const candidates = MOCK_EVALUATIONS[word];
  const result = candidates?.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : DEFAULT_MOCK_EVALUATION;
  logTokenUsage({ usage: result.usage, label: `evaluate (mock): ${word}` });
  return result;
}
