import Anthropic from "npm:@anthropic-ai/sdk@0.110.0";
import {
  buildTokenUsage,
  type PricingModel,
  sumTokenUsage,
  type TokenUsage,
} from "../_shared/usage.ts";
import type { GeneratedSentence, SentenceGeneration } from "./sentenceCache.ts";

export type GenerationSource = "haiku" | "sonnet" | "haiku+sonnet";

export type GenerationModel = "auto" | "haiku" | "sonnet";

const GENERATION_SYSTEM_PROMPT =
  `You help English learners practice a target word. You are given a WORD, a REQUESTED meaning to practice, and a list of all MEANINGS available for that word.

Follow this order:
1. Find a genuine, confidently-attributable published quotation for the REQUESTED meaning.
2. If you cannot, fall back to another meaning from the MEANINGS list for which you can find one.
3. If — after a thorough search — NO meaning in the list yields a real quotation you are confident is genuine, WRITE your own natural example sentence for the REQUESTED meaning (or another meaning from the list), leave "source" empty, and set "generated" to true. Do NOT fabricate an attribution for an invented sentence.
Only use the "error" field if you cannot produce a sentence at all.

Always return a JSON object with ALL of these fields present:
1. "original": a short (ideally 10 words or fewer) sentence in which the WORD is used in the chosen MEANING. When "generated" is false, this must be a genuine quotation taken verbatim from REAL published material (journalism, a book, an essay, a famous speech) that you can confidently attribute — never invent, paraphrase, or approximate one. When "generated" is true, this is a natural sentence you wrote yourself. Either way, give the sentence text ONLY — do NOT wrap it in quotation marks and do NOT append the author or source here. On failure, set this to an empty string.
2. "source": when "generated" is false, the confident attribution — the author and work, or the publication, e.g. Kazuo Ishiguro, The Remains of the Day; it must be a real, specific source, never made up. When "generated" is true, set this to an empty string. On failure, set this to an empty string.
3. "simplified": a plain-language paraphrase of the sentence (without the attribution) that keeps the same idea but uses only simple, common words — AND does NOT contain the WORD or any obvious inflection of it. Replace the word with a plain description of its sense, so the learner can reinstate the word themselves. On failure, set this to an empty string.
4. "rephraseTarget": the exact word-for-word substring of "simplified" — copied verbatim, identical casing, spacing and punctuation — that stands in for the WORD; the plain description the learner must rephrase back into the WORD. It MUST appear inside "simplified" exactly as written. On failure, set to an empty string.
5. "meaning": the exact meaning string you actually used, copied verbatim from the MEANINGS list (whether or not it matches the REQUESTED one). On failure, set this to an empty string.
6. "generated": true when you wrote the sentence yourself because no genuine quotation could be found; false when "original" is a real published quotation.
7. "error": on success, an empty string. Only when you cannot produce a sentence at all, a short plain explanation of why, with "original", "source", "simplified", and "meaning" all set to empty strings.

Rules:
- On success, all of "original", "source" (if present), and "simplified" convey the same situation and meaning.
- Real quotation: {"original": "...", "source": "...", "simplified": "...", "rephraseTarget": "...", "meaning": "...", "generated": false, "error": ""}
- Generated fallback: {"original": "...", "source": "", "simplified": "...", "rephraseTarget": "...", "meaning": "...", "generated": true, "error": ""}
- Failure: {"original": "", "source": "", "simplified": "", "rephraseTarget": "", "meaning": "", "generated": false, "error": "..."}`;

const GENERATION_OUTPUT_FORMAT = {
  type: "json_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      original: { type: "string" },
      source: { type: "string" },
      simplified: { type: "string" },
      rephraseTarget: { type: "string" },
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
      "rephraseTarget",
    ],
  },
} as const;

const SIMPLIFICATION_SYSTEM_PROMPT =
  `You help English learners practice a target word. You are given a WORD, the MEANING it carries here, and a SENTENCE that uses it.

Always return a JSON object with ALL of these fields present:
1. "simplified": a plain-language paraphrase of the SENTENCE (without any attribution) that keeps the same idea but uses only simple, common words — AND does NOT contain the WORD or any obvious inflection of it. Replace the word with a plain description of its sense, so the learner can reinstate the word themselves. On failure, set this to an empty string.
2. "rephraseTarget": the exact word-for-word substring of "simplified" — copied verbatim, identical casing, spacing and punctuation — that stands in for the WORD; the plain description the learner must rephrase back into the WORD. It MUST appear inside "simplified" exactly as written. On failure, set to an empty string.
3. "error": on success, an empty string. Only when you cannot paraphrase the sentence at all, a short plain explanation of why, with "simplified" set to an empty string.

Rules:
- Success: {"simplified": "...", "rephraseTarget": "...", "error": ""}
- Failure: {"simplified": "", "rephraseTarget": "", "error": "..."}`;

const SIMPLIFICATION_OUTPUT_FORMAT = {
  type: "json_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      simplified: { type: "string" },
      rephraseTarget: { type: "string" },
      error: { type: "string" },
    },
    required: ["simplified", "error", "rephraseTarget"],
  },
} as const;

const GENERATION_MODELS: Record<
  PricingModel,
  { id: string; maxTokens: number }
> = {
  haiku: { id: "claude-haiku-4-5-20251001", maxTokens: 1024 },
  // Sonnet 5 thinks by default, so give the output extra headroom.
  sonnet: { id: "claude-sonnet-5", maxTokens: 1536 },
};

function stripFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function isRephraseTargetValid({
  simplified,
  rephraseTarget,
}: {
  simplified: string;
  rephraseTarget: unknown;
}) {
  return Boolean(
    typeof rephraseTarget === "string" &&
      rephraseTarget.length > 0 &&
      simplified.toLowerCase().includes(rephraseTarget.toLowerCase()),
  );
}

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

export function parseGenerationResponse(text: string): GeneratedSentence {
  const parsed = JSON.parse(stripFences(text));

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Response is not a JSON object");
  }

  const {
    original,
    source,
    simplified,
    rephraseTarget,
    meaning,
    generated,
    error,
  } = parsed as {
    original?: unknown;
    source?: unknown;
    simplified?: unknown;
    rephraseTarget?: unknown;
    meaning?: unknown;
    generated?: unknown;
    error?: unknown;
  };

  if (typeof error === "string" && error.trim()) {
    return {
      original: "",
      source: "",
      rephraseTarget: "",
      simplified: "",
      error,
    };
  }

  if (typeof original !== "string" || typeof simplified !== "string") {
    throw new Error('Response missing "original" or "simplified" string');
  }

  return {
    original,
    source: typeof source === "string" ? source : "",
    simplified,
    ...(isRephraseTargetValid({ simplified, rephraseTarget })
      ? { rephraseTarget: String(rephraseTarget) }
      : {}),
    ...(typeof meaning === "string" && meaning.trim() ? { meaning } : {}),
    ...(generated === true ? { generated: true } : {}),
  };
}

export function parseSimplificationResponse(text: string): {
  simplified: string;
  rephraseTarget?: string;
} {
  const parsed = JSON.parse(stripFences(text));

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Response is not a JSON object");
  }

  const { simplified, rephraseTarget, error } = parsed as {
    simplified?: unknown;
    rephraseTarget?: unknown;
    error?: unknown;
  };

  if (typeof error === "string" && error.trim()) {
    throw new Error(error);
  }

  if (typeof simplified !== "string" || !simplified.trim()) {
    throw new Error('Response missing a non-empty "simplified" string');
  }

  return {
    simplified,
    ...(isRephraseTargetValid({ simplified, rephraseTarget })
      ? { rephraseTarget: String(rephraseTarget) }
      : {}),
  };
}

async function runPrompt({
  client,
  pricing,
  system,
  format,
  userContent,
}: {
  client: Anthropic;
  pricing: PricingModel;
  system: string;
  format: typeof GENERATION_OUTPUT_FORMAT | typeof SIMPLIFICATION_OUTPUT_FORMAT;
  userContent: string;
}): Promise<{ text: string; usage: TokenUsage }> {
  const { id, maxTokens } = GENERATION_MODELS[pricing];
  const response = await client.messages.create({
    model: id,
    max_tokens: maxTokens,
    system,
    output_config: { format },
    messages: [{ role: "user", content: userContent }],
  });

  return {
    text: extractText(response.content),
    usage: buildTokenUsage({
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: pricing,
    }),
  };
}

async function runGeneration({
  client,
  pricing,
  userContent,
}: {
  client: Anthropic;
  pricing: PricingModel;
  userContent: string;
}): Promise<SentenceGeneration> {
  const { text, usage } = await runPrompt({
    client,
    pricing,
    system: GENERATION_SYSTEM_PROMPT,
    format: GENERATION_OUTPUT_FORMAT,
    userContent,
  });

  return { sentence: parseGenerationResponse(text), usage };
}

export async function generateFresh({
  client,
  word,
  meaning,
  meanings,
  model = "auto",
}: {
  client: Anthropic;
  word: string;
  meaning: string;
  meanings: string[];
  model?: GenerationModel;
}): Promise<SentenceGeneration & { source: GenerationSource }> {
  const meaningsList = meanings.map((m) => `- ${m}`).join("\n");
  const userContent =
    `Word: ${word}\nRequested meaning: ${meaning}\nMeanings:\n${meaningsList}`;

  if (model === "sonnet") {
    const sonnet = await runGeneration({
      client,
      pricing: "sonnet",
      userContent,
    });
    return { ...sonnet, source: "sonnet" };
  }

  const haiku = await runGeneration({ client, pricing: "haiku", userContent });

  if (model === "haiku" || !haiku.sentence.error) {
    return { ...haiku, source: "haiku" };
  }

  console.warn(
    `Haiku could not generate for "${word}", retrying with Sonnet:`,
    haiku.sentence.error,
  );

  const sonnet = await runGeneration({
    client,
    pricing: "sonnet",
    userContent,
  });

  return {
    sentence: sonnet.sentence,
    usage: sumTokenUsage(haiku.usage, sonnet.usage),
    source: "haiku+sonnet",
  };
}

export async function simplifySentence({
  client,
  word,
  meaning,
  original,
}: {
  client: Anthropic;
  word: string;
  meaning: string;
  original: string;
}): Promise<{ simplified: string; rephraseTarget: string; usage: TokenUsage }> {
  const { text, usage } = await runPrompt({
    client,
    pricing: "haiku",
    system: SIMPLIFICATION_SYSTEM_PROMPT,
    format: SIMPLIFICATION_OUTPUT_FORMAT,
    userContent: `Word: ${word}\nMeaning: ${meaning}\nSentence: ${original}`,
  });

  const { simplified, rephraseTarget } = parseSimplificationResponse(text);

  return { simplified, rephraseTarget: String(rephraseTarget), usage };
}
