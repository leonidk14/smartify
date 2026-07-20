import { buildTokenUsage } from "../_shared/usage.ts";
import { type LookupResponse, type MeaningGroup } from "./dictionary.ts";

function entry({
  groups,
  inputTokens,
  outputTokens,
}: {
  groups: MeaningGroup[];
  inputTokens: number;
  outputTokens: number;
}): LookupResponse {
  return {
    dictionary: { groups },
    usage: buildTokenUsage({ inputTokens, outputTokens }),
  };
}

const MOCK_RESPONSES: Record<string, LookupResponse> = {
  oblivious: entry({
    groups: [
      {
        part_of_speech: "adjective",
        meanings: [
          {
            definition:
              "Not aware of or concerned about what is happening around one; lacking knowledge or consciousness of something.",
            example:
              "'He was oblivious to the commotion around him, lost in thought.' — Jane Austen, Emma",
          },
          {
            definition:
              "Characterized by or showing lack of attention or awareness; inattentive.",
            example:
              "'She walked on, oblivious to the stares of passersby.' — Virginia Woolf, Mrs Dalloway",
          },
        ],
      },
    ],
    inputTokens: 367,
    outputTokens: 134,
  }),

  impudence: entry({
    groups: [
      {
        part_of_speech: "noun",
        meanings: [
          {
            definition:
              "Lack of respect; disrespectful or impertinent behavior or speech.",
            example:
              "'His impudence in contradicting his elders was remarkable.' — Jane Austen, Pride and Prejudice",
          },
          {
            definition:
              "Bold or audacious disregard for convention or propriety.",
            example:
              "'She had the impudence to suggest that the committee had been negligent.' — George Orwell, Politics and the English Language",
          },
        ],
      },
    ],
    inputTokens: 367,
    outputTokens: 129,
  }),

  precarious: entry({
    groups: [
      {
        part_of_speech: "adjective",
        meanings: [
          {
            definition:
              "Dependent on chance or circumstances beyond one's control; uncertain or unpredictable in outcome.",
            example:
              "'The precarious state of the negotiations meant that peace could collapse at any moment.' — David McCullough, Truman",
          },
          {
            definition:
              "Dangerously lacking in stability or security; insecure or unstable in position or condition.",
            example:
              "'He balanced precariously on the narrow ledge, one slip away from disaster.' — Cormac McCarthy, The Road",
          },
        ],
      },
    ],
    inputTokens: 366,
    outputTokens: 140,
  }),

  perilously: entry({
    groups: [
      {
        part_of_speech: "adverb",
        meanings: [
          {
            definition:
              "In a manner involving serious and immediate danger or risk; dangerously.",
            example:
              "'The ship was perilously close to the rocks.' — Patrick O'Brian, Master and Commander",
          },
          {
            definition:
              "To a degree or extent that is alarmingly high or precarious.",
            example:
              "'His health had become perilously fragile after months of illness.' — Hilary Mantel, Wolf Hall",
          },
        ],
      },
    ],
    inputTokens: 367,
    outputTokens: 123,
  }),

  stridency: entry({
    groups: [
      {
        part_of_speech: "noun",
        meanings: [
          {
            definition:
              "The quality of being strident; harshness or shrillness of sound.",
            example:
              "'The stridency of the alarm cut through the morning silence.' — Stephen King, The Shining",
          },
          {
            definition:
              "The quality of being loud, emphatic, or forceful in expression, often in a way that is grating or unpleasant.",
            example:
              "'The stridency of his political rhetoric alienated moderate voters.' — David McCullough, Truman",
          },
        ],
      },
    ],
    inputTokens: 562,
    outputTokens: 174,
  }),

  apoplectic: entry({
    groups: [
      {
        part_of_speech: "adjective",
        meanings: [
          {
            definition:
              "Relating to or affected by apoplexy; of or pertaining to sudden loss of consciousness or paralysis caused by cerebral hemorrhage or thrombosis.",
            example:
              "'He fell in an apoplectic fit, his face darkening with blood.' — Charles Dickens, Our Mutual Friend",
          },
          {
            definition:
              "Extremely angry; furious or enraged to an intense degree.",
            example:
              "'The coach was apoplectic when his team conceded the penalty.' — Sports reporting, The Guardian",
          },
        ],
      },
    ],
    inputTokens: 367,
    outputTokens: 141,
  }),

  swell: entry({
    groups: [
      {
        part_of_speech: "verb",
        meanings: [
          {
            definition:
              "To increase in size, volume, or extent; to expand or enlarge.",
            example:
              "'The river swelled after the heavy rains.' — Mark Twain, The Adventures of Huckleberry Finn",
          },
          {
            definition: "To rise or protrude, as from a surface or body part.",
            example:
              "'Her ankle began to swell from the injury.' — Louisa May Alcott, Little Women",
          },
          {
            definition:
              "To cause to increase in size or volume; to make tumid or turgid.",
            example:
              "'Pride swells the heart of a conceited man.' — Jane Austen, Emma",
          },
          {
            definition:
              "To arise or issue forth; to come forth as a wave or flood of emotion or sound.",
            example:
              "'Music swelled from the concert hall.' — F. Scott Fitzgerald, The Great Gatsby",
          },
        ],
      },
      {
        part_of_speech: "noun",
        meanings: [
          {
            definition:
              "A long wave or undulation of the ocean surface, typically caused by distant storms or strong winds.",
            example:
              "'The ship rose and fell with the swell of the sea.' — Herman Melville, Moby Dick",
          },
          {
            definition:
              "A gradual increase in loudness of sound, particularly in music.",
            example:
              "'The swell of the orchestra filled the concert hall.' — Thomas Mann, The Magic Mountain",
          },
          {
            definition:
              "A protuberance or enlargement on the body or a surface.",
            example:
              "'There was a swell on his forehead where he had struck it.' — Stephen King, The Stand",
          },
        ],
      },
      {
        part_of_speech: "adjective",
        meanings: [
          {
            definition:
              "Excellent or outstanding; admirable or impressive (chiefly British, informal, archaic).",
            example:
              "'That is a swell idea, my dear fellow.' — P. G. Wodehouse, The Inimitable Jeeves",
          },
        ],
      },
    ],
    inputTokens: 561,
    outputTokens: 566,
  }),

  plunge: entry({
    groups: [
      {
        part_of_speech: "verb",
        meanings: [
          {
            definition:
              "To dive or fall suddenly and steeply into water or another medium.",
            example:
              "'He took a deep breath and plunged into the icy lake.' — Ranulph Fiennes, Mind Over Matter",
          },
          {
            definition:
              "To thrust or push something suddenly and forcefully into or through something else.",
            example:
              "'The knife plunged through the fabric with ease.' — Agatha Christie, Murder on the Orient Express",
          },
          {
            definition:
              "To descend or drop suddenly; to fall sharply in value or intensity.",
            example:
              "'The stock market plunged amid economic uncertainty.' — Financial Times",
          },
          {
            definition:
              "To move abruptly or impetuously into an action, condition, or situation.",
            example:
              "'They plunged ahead with the renovation despite budget constraints.' — The Guardian",
          },
          {
            definition: "To immerse or submerge in liquid.",
            example:
              "'Plunge the vegetables into boiling water for three minutes.' — Nigella Lawson, How to Eat",
          },
        ],
      },
      {
        part_of_speech: "noun",
        meanings: [
          {
            definition: "An act of plunging; a sudden dive or fall.",
            example:
              "'The plunge into the pool felt exhilarating on the hot summer day.' — David Copperfield",
          },
          {
            definition:
              "A sudden and marked fall in value, amount, or intensity.",
            example:
              "'The company faced a financial plunge after the scandal broke.' — The Economist",
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
