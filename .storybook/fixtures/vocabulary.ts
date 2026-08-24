import type { LookupResult } from "~/routes/wordSearch/actions";
import { buildTokenUsage } from "~/routes/wordSearch/usage";
import type {
  StoredMeaningGroup,
  VocabularyStore,
} from "~/routes/wordSearch/vocabulary";

function group(
  partOfSpeech: string,
  definitions: string[],
): StoredMeaningGroup {
  return {
    part_of_speech: partOfSpeech,
    meanings: Object.fromEntries(
      definitions.map((definition, order) => [
        `${partOfSpeech}-${order}`,
        { definition, order },
      ]),
    ),
  };
}

export const vocabularyFixture: VocabularyStore = {
  oblivious: {
    groups: [
      group("adjective", [
        "Not aware of or concerned about what is happening around one.",
        "Characterized by or showing a lack of attention; inattentive.",
      ]),
    ],
    display: "oblivious",
    typed: "oblivious",
    shouldPracticeLater: true,
    savedAt: "2026-08-10T09:12:00.000Z",
    isPublic: false,
  },
  impudence: {
    groups: [
      group("noun", [
        "The quality of being unpleasantly bold or disrespectful.",
      ]),
    ],
    display: "impudence",
    typed: "impudence",
    shouldPracticeLater: true,
    savedAt: "2026-08-09T18:40:00.000Z",
    isPublic: false,
  },
  linger: {
    groups: [
      group("verb", [
        "To stay in a place longer than necessary, out of reluctance to leave.",
        "To be slow to disappear or die.",
      ]),
    ],
    display: "linger",
    typed: "lingering",
    shouldPracticeLater: false,
    savedAt: "2026-08-08T07:05:00.000Z",
    isPublic: false,
  },
  serendipity: {
    groups: [
      group("noun", [
        "The occurrence of events by chance in a happy or beneficial way.",
      ]),
    ],
    display: "serendipity",
    typed: "serendipity",
    shouldPracticeLater: false,
    savedAt: "2026-08-07T12:30:00.000Z",
    isPublic: true,
  },
  "to-swell": {
    groups: [
      group("verb", [
        "To become larger or rounder in size, typically as a result of an accumulation of fluid.",
        "To increase in number, amount, or intensity.",
      ]),
    ],
    display: "to swell",
    typed: "swelling",
    shouldPracticeLater: false,
    savedAt: "2026-08-06T14:20:00.000Z",
    isPublic: false,
  },
};

export function lookupFixture(word: string): LookupResult {
  return {
    dictionary: {
      normalized: word,
      groups: [
        {
          part_of_speech: "noun",
          meanings: [
            {
              definition: `A placeholder definition of “${word}”, served by the Storybook mock.`,
              example: {
                original: `Nobody could agree on what “${word}” was supposed to mean.`,
                source: "Storybook fixture",
                generated: false,
              },
            },
          ],
        },
      ],
    },
    usage: buildTokenUsage({ inputTokens: 367, outputTokens: 134 }),
  };
}
