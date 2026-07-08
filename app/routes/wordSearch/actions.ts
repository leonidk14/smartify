import Anthropic from "@anthropic-ai/sdk";
import {
  MOCK_ERROR_RESPONSE,
  MOCK_RESPONSES,
  MOCK_RESPONSES_TYPO,
} from "./mocks";
import { buildTokenUsage, logTokenUsage, type TokenUsage } from "./usage";

export type { TokenUsage } from "./usage";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Meaning {
  definition: string;
  example: string;
}

export interface MeaningGroup {
  part_of_speech: string;
  meanings: Meaning[];
}

export interface Typo {
  input: string;
  suggestion: string;
}

export interface DictionaryResult {
  groups: MeaningGroup[];
  typo?: Typo;
}

export type LookupResult = {
  dictionary: DictionaryResult;
  usage: TokenUsage;
  originalSearchItem?: string;
  shouldPracticeLater?: boolean;
};

const DICTIONARY_SYSTEM_PROMPT = `You are a strict dictionary lookup service. When given a word or phrase, provide its meanings in the style and substance of the Oxford English Dictionary — concise, precise, and ordered by most common usage first.
 
CRITICAL — Typo detection:
- You must ONLY define words that are spelled correctly and exist as real dictionary entries.
- NEVER silently correct, autocorrect, or interpret a misspelled word. If the input contains a spelling error — even a single transposed, missing, or extra letter — do NOT return definitions. Instead return the typo error response shown below.
- For example: "apopleptic" is NOT a word. Do not treat it as "apoplectic". Return the typo error.
 
Typo error response shape:
{"error": "typo", "input": "apopleptic", "suggestion": "apoplectic"}
 
Rules for valid words:
1. Group meanings by part of speech (e.g. noun, verb, adjective, phrase, idiom). Each group contains one or more definitions that share that grammatical role.
2. For each individual meaning, provide exactly one real-world example of the word or phrase used in published literature, journalism, or a famous speech. Format the example as a short quote wrapped in single quotation marks followed by an em dash and the author and work title, e.g. 'The light was ephemeral, vanishing before dawn.' — Kazuo Ishiguro, The Remains of the Day. Never use double quotes inside the example string — they break JSON. The quote must be a plausible, representative usage — do not fabricate absurd sentences.
3. Use formal, dictionary-register language for definitions. Do not add etymologies or commentary.
4. If the input is a well-known phrase or idiom, treat it as a single unit under the part of speech "phrase" or "idiom".
5. If the word is spelled correctly but has no recognized meaning, return an empty groups array.
 
Always return a JSON object with ALL of "error", "input", "suggestion", and "groups" present.
- Valid word: set "error", "input", and "suggestion" to empty strings and fill "groups".
- Typo: set "error" to "typo", "input" to the misspelled input, "suggestion" to the closest correct word, and "groups" to an empty array.
- Correctly spelled but no recognized meaning: empty strings for "error"/"input"/"suggestion" and an empty "groups" array.

Success shape:
{"error": "", "input": "", "suggestion": "", "groups": [{"part_of_speech": "noun", "meanings": [{"definition": "...", "example": "'...' — Author, Title"}]}]}

Typo shape:
{"error": "typo", "input": "the misspelled input", "suggestion": "the closest correct word", "groups": []}`;

const DICTIONARY_OUTPUT_FORMAT = {
  type: "json_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      error: { type: "string" },
      input: { type: "string" },
      suggestion: { type: "string" },
      groups: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            part_of_speech: { type: "string" },
            meanings: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  definition: { type: "string" },
                  example: { type: "string" },
                },
                required: ["definition", "example"],
              },
            },
          },
          required: ["part_of_speech", "meanings"],
        },
      },
    },
    required: ["error", "input", "suggestion", "groups"],
  },
} as const;

// ── Response parsing ───────────────────────────────────────────────────────────

function parseDictionaryResponse(text: string): DictionaryResult {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Response is not a JSON object");
  }

  // Typo response shape: {"error": "typo", "input": "...", "suggestion": "..."}
  if ((parsed as { error?: unknown }).error === "typo") {
    const { input, suggestion } = parsed as {
      input?: unknown;
      suggestion?: unknown;
    };
    if (typeof input !== "string" || typeof suggestion !== "string") {
      throw new Error('Typo response missing "input" or "suggestion" string');
    }
    return { groups: [], typo: { input, suggestion } };
  }

  if (!Array.isArray((parsed as DictionaryResult).groups)) {
    throw new Error('Response missing "groups" array');
  }

  const groups = (parsed as DictionaryResult).groups.map((group) => {
    if (typeof group?.part_of_speech !== "string") {
      throw new Error('Group missing "part_of_speech" string');
    }
    if (!Array.isArray(group.meanings)) {
      throw new Error('Group missing "meanings" array');
    }
    return {
      part_of_speech: group.part_of_speech,
      meanings: group.meanings.map((meaning) => {
        if (
          typeof meaning?.definition !== "string" ||
          typeof meaning?.example !== "string"
        ) {
          throw new Error('Meaning missing "definition" or "example" string');
        }
        return { definition: meaning.definition, example: meaning.example };
      }),
    };
  });

  return { groups };
}

// ── Lookup ─────────────────────────────────────────────────────────────────────

export async function lookupWord(word: string): Promise<LookupResult> {
  // ── Mock mode (uncomment below and comment out mock logic for real API) ──
  const delay = 500 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const key = word.toLowerCase();
  const result =
    MOCK_RESPONSES[key] ?? MOCK_RESPONSES_TYPO[key] ?? MOCK_ERROR_RESPONSE;
  logTokenUsage(result.usage, word);
  return result;

  // ── Real API call ───────────────────────────────────────────────────────
  // const client = new Anthropic();

  // const response = await client.messages.create({
  //   model: "claude-haiku-4-5-20251001",
  //   max_tokens: 1024,
  //   system: DICTIONARY_SYSTEM_PROMPT,
  //   output_config: { format: DICTIONARY_OUTPUT_FORMAT },
  //   messages: [{ role: "user", content: `Define: ${word}` }],
  // });

  // console.log("raw", response);

  // const raw = response.content[0];
  // if (raw.type !== "text") {
  //   throw new Error("Unexpected response type from API");
  // }

  // const dictionary = parseDictionaryResponse(raw.text);
  // const usage = buildTokenUsage(
  //   response.usage.input_tokens,
  //   response.usage.output_tokens,
  // );
  // logTokenUsage(usage, word);

  // return { dictionary, usage };
}
