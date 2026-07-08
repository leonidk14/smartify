import type {
  EvaluationResult,
  GeneratedSentence,
  SentenceEvaluation,
  SentenceGeneration,
} from "./sentenceActions";
import { buildTokenUsage } from "../wordSearch/usage";

function generation(
  sentence: GeneratedSentence,
  inputTokens: number,
  outputTokens: number,
): SentenceGeneration {
  return {
    sentence,
    usage: buildTokenUsage(inputTokens, outputTokens),
  };
}

function evaluation(
  result: SentenceEvaluation,
  inputTokens: number,
  outputTokens: number,
): EvaluationResult {
  return {
    evaluation: result,
    usage: buildTokenUsage(inputTokens, outputTokens),
  };
}

export const MOCK_GENERATIONS: Record<string, SentenceGeneration> = {
  crikey: generation(
    {
      original: "Crikey, mate, that's a big croc!",
      source:
        "Steve Irwin, The Crocodile Hunter (television series and associated media)",
      simplified: "Wow, friend, that's a huge crocodile!",
      meaning: "An exclamation of surprise, alarm, or astonishment.",
    },
    878,
    82,
  ),

  stridency: generation(
    {
      original: "The stridency of the alarm jolted him awake.",
      source: "",
      simplified:
        "The harsh, piercing quality of the sound woke him up suddenly.",
      meaning:
        "The quality of being strident; harshness or shrillness of sound.",
      generated: true,
    },
    1102,
    69,
  ),
};

// Each word can have several mock evaluations; the action picks one at random.
export const MOCK_EVALUATIONS: Record<string, EvaluationResult[]> = {
  // Near-perfect: no correction, empty segments.
  crikey: [evaluation({ score: 9.8 }, 1062, 24)],

  stridency: [
    // Below threshold: minimally corrected with changed segments flagged.
    evaluation(
      {
        score: 9.2,
        correctedSentence: "The stridency of the alarm woke him up suddenly.",
        segments: [
          { text: "The stridency ", changed: false },
          { text: "of the alarm ", changed: true },
          { text: "woke him up suddenly.", changed: false },
        ],
      },
      1065,
      79,
    ),
  ],
};

export const DEFAULT_MOCK_GENERATION: SentenceGeneration = generation(
  {
    original: "The light was ephemeral.",
    source: "Kazuo Ishiguro, The Remains of the Day",
    simplified: "The light lasted only a very short time.",
  },
  280,
  90,
);

export const DEFAULT_MOCK_EVALUATION: EvaluationResult = evaluation(
  {
    score: 7.5,
    correctedSentence: "Her ephemeral joy faded by morning.",
    segments: [
      { text: "Her ", changed: false },
      { text: "ephemeral", changed: true },
      { text: " joy faded by morning.", changed: false },
    ],
  },
  320,
  70,
);
