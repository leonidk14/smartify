import Anthropic from "@anthropic-ai/sdk";
import { buildTokenUsage, logTokenUsage } from "../wordSearch/usage";
import { postFunction } from "../../lib/supabaseFunctions";
import { DEFAULT_MOCK_EVALUATION, MOCK_EVALUATIONS } from "./mocks";
import type {
  EvaluationResult,
  SentenceEvaluation,
  SentenceGeneration,
} from "./sentenceTypes";

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
  const { sentence, usage, source } = await postFunction<
    SentenceGeneration & { source: string }
  >(
    "generate-sentence",
    { word, meaningId, meaningDefinition, meanings },
    { "x-lookup-key": import.meta.env.VITE_LOOKUP_KEY },
  );

  logTokenUsage({ usage, label: `generate (${source}): ${word}` });
  return { sentence, usage };
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
