import { buildTokenUsage } from "../_shared/usage.ts";
import type { GeneratedSentence, SentenceGeneration } from "./sentenceCache.ts";

function generation({
  sentence,
  inputTokens,
  outputTokens,
}: {
  sentence: GeneratedSentence;
  inputTokens: number;
  outputTokens: number;
}): SentenceGeneration {
  return {
    sentence,
    usage: buildTokenUsage({ inputTokens, outputTokens }),
  };
}

const MOCK_GENERATIONS: Record<string, SentenceGeneration> = {
  crikey: generation({
    sentence: {
      original: "Crikey, mate, that's a big croc!",
      source:
        "Steve Irwin, The Crocodile Hunter (television series and associated media)",
      simplified: "Wow, friend, that's a huge crocodile!",
      rephraseTarget: "Wow",
      meaning: "An exclamation of surprise, alarm, or astonishment.",
    },
    inputTokens: 878,
    outputTokens: 82,
  }),

  stridency: generation({
    sentence: {
      original: "The stridency of the alarm jolted him awake.",
      source: "",
      simplified:
        "The harsh, piercing quality of the sound woke him up suddenly.",
      rephraseTarget: "The harsh, piercing quality",
      meaning:
        "The quality of being strident; harshness or shrillness of sound.",
      generated: true,
    },
    inputTokens: 1102,
    outputTokens: 69,
  }),
};

const DEFAULT_MOCK_GENERATION: SentenceGeneration = generation({
  sentence: {
    original: "The light was ephemeral.",
    source: "Kazuo Ishiguro, The Remains of the Day",
    simplified: "The light lasted only a very short time.",
    rephraseTarget: "ephemeral",
  },
  inputTokens: 280,
  outputTokens: 90,
});

export async function generateMock(word: string): Promise<SentenceGeneration> {
  const delay = 500 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  return MOCK_GENERATIONS[word] ?? DEFAULT_MOCK_GENERATION;
}
