import { buildTokenUsage } from "../_shared/usage.ts";
import type { EvaluationResult, SentenceEvaluation } from "./evaluation.ts";

function evaluation({
  result,
  inputTokens,
  outputTokens,
}: {
  result: SentenceEvaluation;
  inputTokens: number;
  outputTokens: number;
}): EvaluationResult {
  return {
    evaluation: result,
    usage: buildTokenUsage({ inputTokens, outputTokens }),
  };
}

// Each word can have several mock evaluations; one is picked at random.
const MOCK_EVALUATIONS: Record<string, EvaluationResult[]> = {
  // Near-perfect: no correction, empty segments.
  crikey: [
    evaluation({ result: { score: 9.8 }, inputTokens: 1062, outputTokens: 24 }),
  ],

  stridency: [
    // Below threshold: minimally corrected with changed segments flagged.
    evaluation({
      result: {
        score: 9.2,
        correctedSentence: "The stridency of the alarm woke him up suddenly.",
        segments: [
          { text: "The stridency ", changed: false },
          { text: "of the alarm ", changed: true },
          { text: "woke him up suddenly.", changed: false },
        ],
      },
      inputTokens: 1065,
      outputTokens: 79,
    }),
  ],
};

const DEFAULT_MOCK_EVALUATION: EvaluationResult = evaluation({
  result: {
    score: 7.5,
    correctedSentence: "Her ephemeral joy faded by morning.",
    segments: [
      { text: "Her ", changed: false },
      { text: "ephemeral", changed: true },
      { text: " joy faded by morning.", changed: false },
    ],
  },
  inputTokens: 320,
  outputTokens: 70,
});

export async function evaluateMock(word: string): Promise<EvaluationResult> {
  const delay = 500 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  const candidates = MOCK_EVALUATIONS[word];
  return candidates?.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : DEFAULT_MOCK_EVALUATION;
}
