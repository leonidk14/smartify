// Client-safe shared types and constants for sentence practice. Kept separate
// from sentenceActions.server so client components can import them without
// pulling server-only code into the browser bundle.
import type { TokenUsage } from "../wordSearch/usage";

export type { TokenUsage };

export interface GeneratedSentence {
  original: string;
  source: string;
  simplified: string;
  /** Set only when the meaning used differs from the requested one. */
  meaning?: string;
  /** True when the sentence was written by the model, not a real quotation. */
  generated?: boolean;
  /** Set only when no sentence at all could be produced. */
  error?: string;
}

export interface SentenceGeneration {
  sentence: GeneratedSentence;
  usage: TokenUsage;
}

export interface CachedSentence {
  sentence: GeneratedSentence;
  usageCount: number;
}

export interface CorrectionSegment {
  text: string;
  changed: boolean;
}

export interface SentenceEvaluation {
  score: number;
  correctedSentence?: string;
  segments?: CorrectionSegment[];
}

export interface EvaluationResult {
  evaluation: SentenceEvaluation;
  usage: TokenUsage;
}
