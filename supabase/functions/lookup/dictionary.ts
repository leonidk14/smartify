import type { TokenUsage } from "../_shared/usage.ts";

export interface ExampleSentence {
  original: string;
  source: string;
  /** The prompt requires a real quotation, so this should always be false. */
  generated: boolean;
}

export interface Meaning {
  definition: string;
  example: ExampleSentence;
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

export interface LookupResponse {
  dictionary: DictionaryResult;
  usage: TokenUsage;
}

export const DICTIONARY_SYSTEM_PROMPT = `You are a strict dictionary lookup service. When given a word or phrase, provide its meanings in the style and substance of the Oxford English Dictionary — concise, precise, and ordered by most common usage first.

CRITICAL — Typo detection:
- You must ONLY define words that are spelled correctly and exist as real dictionary entries.
- NEVER silently correct, autocorrect, or interpret a misspelled word. If the input contains a spelling error — even a single transposed, missing, or extra letter — do NOT return definitions. Instead return the typo error response shown below.
- For example: "apopleptic" is NOT a word. Do not treat it as "apoplectic". Return the typo error.

Typo error response shape:
{"error": "typo", "input": "apopleptic", "suggestion": "apoplectic"}

Rules for valid words:
1. Group meanings by part of speech (e.g. noun, verb, adjective, phrase, idiom). Each group contains one or more definitions that share that grammatical role.
2. For each individual meaning, provide exactly one real-world example of the word or phrase used in published literature, journalism, or a famous speech, as an "example" object with these three fields:
   - "original": the quoted sentence text ONLY — do NOT wrap it in quotation marks and do NOT append the author or source here. It must be a plausible, representative usage — do not fabricate absurd sentences. Never use double quotes inside it — they break JSON.
   - "source": the attribution — the author and work title, or the publication, e.g. Kazuo Ishiguro, The Remains of the Day.
   - "generated": always false. The example must be a real published quotation, never a sentence you wrote yourself.
3. Use formal, dictionary-register language for definitions. Do not add etymologies or commentary.
4. If the input is a well-known phrase or idiom, treat it as a single unit under the part of speech "phrase" or "idiom".
5. If the word is spelled correctly but has no recognized meaning, return an empty groups array.

Always return a JSON object with ALL of "error", "input", "suggestion", and "groups" present.
- Valid word: set "error", "input", and "suggestion" to empty strings and fill "groups".
- Typo: set "error" to "typo", "input" to the misspelled input, "suggestion" to the closest correct word, and "groups" to an empty array.
- Correctly spelled but no recognized meaning: empty strings for "error"/"input"/"suggestion" and an empty "groups" array.

Success shape:
{"error": "", "input": "", "suggestion": "", "groups": [{"part_of_speech": "noun", "meanings": [{"definition": "...", "example": {"original": "...", "source": "Author, Title", "generated": false}}]}]}

Typo shape:
{"error": "typo", "input": "the misspelled input", "suggestion": "the closest correct word", "groups": []}`;

export const DICTIONARY_OUTPUT_FORMAT = {
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
                  example: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      original: { type: "string" },
                      source: { type: "string" },
                      generated: { type: "boolean" },
                    },
                    required: ["original", "source", "generated"],
                  },
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

export function parseDictionaryResponse(text: string): DictionaryResult {
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
        if (typeof meaning?.definition !== "string") {
          throw new Error('Meaning missing "definition" string');
        }
        const example = meaning?.example;
        if (
          typeof example?.original !== "string" ||
          typeof example?.source !== "string" ||
          typeof example?.generated !== "boolean"
        ) {
          throw new Error(
            'Meaning missing a valid "example" object with "original", "source" and "generated"',
          );
        }
        return {
          definition: meaning.definition,
          example: {
            original: example.original,
            source: example.source,
            generated: example.generated,
          },
        };
      }),
    };
  });

  return { groups };
}
