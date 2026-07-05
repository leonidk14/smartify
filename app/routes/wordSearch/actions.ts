import Anthropic from "@anthropic-ai/sdk";
import { MOCK_ERROR_RESPONSE, MOCK_RESPONSES } from "./mocks";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DictionaryResult {
  meaning: string[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export type LookupResult = {
  dictionary: DictionaryResult;
  usage: TokenUsage;
};

// ── Pricing (USD per token) ────────────────────────────────────────────────────
// Claude Haiku 4.5: $1.00 / 1M input tokens, $5.00 / 1M output tokens
// Source: https://www.anthropic.com/pricing — verify if prices change.

const HAIKU_INPUT_PRICE_PER_TOKEN = 1.0 / 1_000_000;
const HAIKU_OUTPUT_PRICE_PER_TOKEN = 5.0 / 1_000_000;

const DICTIONARY_SYSTEM_PROMPT = `You are a dictionary lookup service. When given a word or phrase, provide its meanings in the style and substance of the Oxford English Dictionary — concise, precise, and ordered by most common usage first.

Rules:
1. Each meaning must be a single, self-contained definition string.
2. Include the part of speech at the start of each meaning in parentheses, e.g. "(noun)", "(verb)", "(adjective)", "(phrase)", "(idiom)".
3. Cover all major senses of the word or phrase across different parts of speech.
4. Use formal, dictionary-register language. Do not add examples, etymologies, or commentary.
5. If the input is a well-known phrase or idiom, define it as a whole unit.
6. If the word or phrase has no recognized meaning, return an empty array.

Respond with ONLY a JSON object in this exact shape — no markdown, no backticks, no preamble, no explanation:
{"meaning": ["...", "..."]}`;

export async function lookupWord(word: string): Promise<LookupResult> {
  // ── Mock mode (uncomment below and comment out mock logic for real API) ──
  const delay = 500 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const mock = MOCK_RESPONSES[word.toLowerCase()];
  return mock ?? MOCK_ERROR_RESPONSE;

  // ── Real API call ───────────────────────────────────────────────────────
  // const client = new Anthropic();

  // const response = await client.messages.create({
  //   model: "claude-haiku-4-5-20251001",
  //   max_tokens: 1024,
  //   system: DICTIONARY_SYSTEM_PROMPT,
  //   messages: [{ role: "user", content: `Define: ${word}` }],
  // });

  // const raw = response.content[0];
  // if (raw.type !== "text") {
  //   throw new Error("Unexpected response type from API");
  // }

  // const cleaned = raw.text
  //   .trim()
  //   .replace(/^```(?:json)?\s*/i, "")
  //   .replace(/\s*```$/i, "")
  //   .trim();

  // const parsed: DictionaryResult = JSON.parse(cleaned);

  // if (!Array.isArray(parsed.meaning)) {
  //   throw new Error('Response missing "meaning" array');
  // }

  // const inputTokens = response.usage.input_tokens;
  // const outputTokens = response.usage.output_tokens;
  // const inputCost = inputTokens * HAIKU_INPUT_PRICE_PER_TOKEN;
  // const outputCost = outputTokens * HAIKU_OUTPUT_PRICE_PER_TOKEN;

  // return {
  //   dictionary: parsed,
  //   usage: {
  //     inputTokens,
  //     outputTokens,
  //     totalTokens: inputTokens + outputTokens,
  //     inputCost,
  //     outputCost,
  //     totalCost: inputCost + outputCost,
  //   },
  // };
}

// ── Pretty-print helper ────────────────────────────────────────────────────────

export function formatUSD(amount: number): string {
  return amount < 0.01 ? `$${amount.toFixed(6)}` : `$${amount.toFixed(4)}`;
}
