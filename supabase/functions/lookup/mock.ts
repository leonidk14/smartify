import { buildTokenUsage } from "../_shared/usage.ts";
import { type LookupResponse, type MeaningGroup } from "./dictionary.ts";

function entry({
  groups,
  normalized = "",
  inputTokens,
  outputTokens,
}: {
  groups: MeaningGroup[];
  normalized?: string;
  inputTokens: number;
  outputTokens: number;
}): LookupResponse {
  return {
    dictionary: { groups, normalized },
    usage: buildTokenUsage({ inputTokens, outputTokens }),
  };
}

const MOCK_RESPONSES: Record<string, LookupResponse> = {
  oblivious: entry({
    normalized: "oblivious",
    groups: [
      {
        part_of_speech: "adjective",
        meanings: [
          {
            definition:
              "Not aware of or concerned about what is happening around one; lacking knowledge or consciousness of something.",
            example: {
              original:
                "He was oblivious to the commotion around him, lost in thought.",
              source: "Jane Austen, Emma",
              generated: false,
            },
          },
          {
            definition:
              "Characterized by or showing lack of attention or awareness; inattentive.",
            example: {
              original: "She walked on, oblivious to the stares of passersby.",
              source: "Virginia Woolf, Mrs Dalloway",
              generated: false,
            },
          },
        ],
      },
    ],
    inputTokens: 367,
    outputTokens: 134,
  }),

  impudence: entry({
    normalized: "impudence",
    groups: [
      {
        part_of_speech: "noun",
        meanings: [
          {
            definition:
              "Lack of respect; disrespectful or impertinent behavior or speech.",
            example: {
              original:
                "His impudence in contradicting his elders was remarkable.",
              source: "Jane Austen, Pride and Prejudice",
              generated: false,
            },
          },
          {
            definition:
              "Bold or audacious disregard for convention or propriety.",
            example: {
              original:
                "She had the impudence to suggest that the committee had been negligent.",
              source: "George Orwell, Politics and the English Language",
              generated: false,
            },
          },
        ],
      },
    ],
    inputTokens: 367,
    outputTokens: 129,
  }),

  precarious: entry({
    normalized: "precarious",
    groups: [
      {
        part_of_speech: "adjective",
        meanings: [
          {
            definition:
              "Dependent on chance or circumstances beyond one's control; uncertain or unpredictable in outcome.",
            example: {
              original:
                "The precarious state of the negotiations meant that peace could collapse at any moment.",
              source: "David McCullough, Truman",
              generated: false,
            },
          },
          {
            definition:
              "Dangerously lacking in stability or security; insecure or unstable in position or condition.",
            example: {
              original:
                "He balanced precariously on the narrow ledge, one slip away from disaster.",
              source: "Cormac McCarthy, The Road",
              generated: false,
            },
          },
        ],
      },
    ],
    inputTokens: 366,
    outputTokens: 140,
  }),

  perilously: entry({
    normalized: "perilously",
    groups: [
      {
        part_of_speech: "adverb",
        meanings: [
          {
            definition:
              "In a manner involving serious and immediate danger or risk; dangerously.",
            example: {
              original: "The ship was perilously close to the rocks.",
              source: "Patrick O'Brian, Master and Commander",
              generated: false,
            },
          },
          {
            definition:
              "To a degree or extent that is alarmingly high or precarious.",
            example: {
              original:
                "His health had become perilously fragile after months of illness.",
              source: "Hilary Mantel, Wolf Hall",
              generated: false,
            },
          },
        ],
      },
    ],
    inputTokens: 367,
    outputTokens: 123,
  }),

  stridency: entry({
    normalized: "stridency",
    groups: [
      {
        part_of_speech: "noun",
        meanings: [
          {
            definition:
              "The quality of being strident; harshness or shrillness of sound.",
            example: {
              original:
                "The stridency of the alarm cut through the morning silence.",
              source: "Stephen King, The Shining",
              generated: false,
            },
          },
          {
            definition:
              "The quality of being loud, emphatic, or forceful in expression, often in a way that is grating or unpleasant.",
            example: {
              original:
                "The stridency of his political rhetoric alienated moderate voters.",
              source: "David McCullough, Truman",
              generated: false,
            },
          },
        ],
      },
    ],
    inputTokens: 562,
    outputTokens: 174,
  }),

  apoplectic: entry({
    normalized: "apoplectic",
    groups: [
      {
        part_of_speech: "adjective",
        meanings: [
          {
            definition:
              "Relating to or affected by apoplexy; of or pertaining to sudden loss of consciousness or paralysis caused by cerebral hemorrhage or thrombosis.",
            example: {
              original:
                "He fell in an apoplectic fit, his face darkening with blood.",
              source: "Charles Dickens, Our Mutual Friend",
              generated: false,
            },
          },
          {
            definition:
              "Extremely angry; furious or enraged to an intense degree.",
            example: {
              original:
                "The coach was apoplectic when his team conceded the penalty.",
              source: "Sports reporting, The Guardian",
              generated: false,
            },
          },
        ],
      },
    ],
    inputTokens: 367,
    outputTokens: 141,
  }),

  swell: entry({
    normalized: "to swell",
    groups: [
      {
        part_of_speech: "verb",
        meanings: [
          {
            definition:
              "To increase in size, volume, or extent; to expand or enlarge.",
            example: {
              original: "The river swelled after the heavy rains.",
              source: "Mark Twain, The Adventures of Huckleberry Finn",
              generated: false,
            },
          },
          {
            definition: "To rise or protrude, as from a surface or body part.",
            example: {
              original: "Her ankle began to swell from the injury.",
              source: "Louisa May Alcott, Little Women",
              generated: false,
            },
          },
          {
            definition:
              "To cause to increase in size or volume; to make tumid or turgid.",
            example: {
              original: "Pride swells the heart of a conceited man.",
              source: "Jane Austen, Emma",
              generated: false,
            },
          },
          {
            definition:
              "To arise or issue forth; to come forth as a wave or flood of emotion or sound.",
            example: {
              original: "Music swelled from the concert hall.",
              source: "F. Scott Fitzgerald, The Great Gatsby",
              generated: false,
            },
          },
        ],
      },
      {
        part_of_speech: "noun",
        meanings: [
          {
            definition:
              "A long wave or undulation of the ocean surface, typically caused by distant storms or strong winds.",
            example: {
              original: "The ship rose and fell with the swell of the sea.",
              source: "Herman Melville, Moby Dick",
              generated: false,
            },
          },
          {
            definition:
              "A gradual increase in loudness of sound, particularly in music.",
            example: {
              original: "The swell of the orchestra filled the concert hall.",
              source: "Thomas Mann, The Magic Mountain",
              generated: false,
            },
          },
          {
            definition:
              "A protuberance or enlargement on the body or a surface.",
            example: {
              original:
                "There was a swell on his forehead where he had struck it.",
              source: "Stephen King, The Stand",
              generated: false,
            },
          },
        ],
      },
      {
        part_of_speech: "adjective",
        meanings: [
          {
            definition:
              "Excellent or outstanding; admirable or impressive (chiefly British, informal, archaic).",
            example: {
              original: "That is a swell idea, my dear fellow.",
              source: "P. G. Wodehouse, The Inimitable Jeeves",
              generated: false,
            },
          },
        ],
      },
    ],
    inputTokens: 561,
    outputTokens: 566,
  }),

  plunge: entry({
    normalized: "to plunge",
    groups: [
      {
        part_of_speech: "verb",
        meanings: [
          {
            definition:
              "To dive or fall suddenly and steeply into water or another medium.",
            example: {
              original: "He took a deep breath and plunged into the icy lake.",
              source: "Ranulph Fiennes, Mind Over Matter",
              generated: false,
            },
          },
          {
            definition:
              "To thrust or push something suddenly and forcefully into or through something else.",
            example: {
              original: "The knife plunged through the fabric with ease.",
              source: "Agatha Christie, Murder on the Orient Express",
              generated: false,
            },
          },
          {
            definition:
              "To descend or drop suddenly; to fall sharply in value or intensity.",
            example: {
              original: "The stock market plunged amid economic uncertainty.",
              source: "Financial Times",
              generated: false,
            },
          },
          {
            definition:
              "To move abruptly or impetuously into an action, condition, or situation.",
            example: {
              original:
                "They plunged ahead with the renovation despite budget constraints.",
              source: "The Guardian",
              generated: false,
            },
          },
          {
            definition: "To immerse or submerge in liquid.",
            example: {
              original:
                "Plunge the vegetables into boiling water for three minutes.",
              source: "Nigella Lawson, How to Eat",
              generated: false,
            },
          },
        ],
      },
      {
        part_of_speech: "noun",
        meanings: [
          {
            definition: "An act of plunging; a sudden dive or fall.",
            example: {
              original:
                "The plunge into the pool felt exhilarating on the hot summer day.",
              source: "David Copperfield",
              generated: false,
            },
          },
          {
            definition:
              "A sudden and marked fall in value, amount, or intensity.",
            example: {
              original:
                "The company faced a financial plunge after the scandal broke.",
              source: "The Economist",
              generated: false,
            },
          },
        ],
      },
    ],
    inputTokens: 561,
    outputTokens: 449,
  }),
};

const MOCK_RESPONSES_TYPO: Record<string, LookupResponse> = {
  apopletic: {
    dictionary: {
      groups: [],
      normalized: "",
      typo: { input: "apopletic", suggestion: "apoplectic" },
    },
    usage: buildTokenUsage({ inputTokens: 562, outputTokens: 31 }),
  },
};

const MOCK_NOT_FOUND: LookupResponse = entry({
  groups: [],
  inputTokens: 243,
  outputTokens: 8,
});

// `word` is already de-slugged (spaces, no dashes); match the mock keys case-insensitively.
export function lookupMock(word: string): LookupResponse {
  const key = word.toLowerCase();
  return MOCK_RESPONSES[key] ?? MOCK_RESPONSES_TYPO[key] ?? MOCK_NOT_FOUND;
}
