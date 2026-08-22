import { create } from "zustand";

type Phase = "word" | "sentence";
export type PracticeMode = "word" | "sentence" | "both";
export type StepOutcome = "correct" | "wrong" | "revealed";

export interface StepResult {
  word: string;
  display?: string;
  step: Phase;
  outcome: StepOutcome;
}

interface SessionState {
  queue: string[];
  phase: Phase;
  mode: PracticeMode;
  meaningIds: Record<string, string>;
  results: StepResult[];
  startSession: (words: string[], mode?: PracticeMode) => void;
  setMeaning: (word: string, meaningId: string) => void;
  setPhase: (phase: Phase) => void;
  recordResult: (
    word: string,
    step: Phase,
    outcome: StepOutcome,
    display?: string,
  ) => void;
  reset: () => void;
}

const EMPTY = {
  queue: [],
  phase: "word" as Phase,
  mode: "both" as PracticeMode,
  meaningIds: {},
  results: [] as StepResult[],
};

export const useSessionStore = create<SessionState>((set) => ({
  ...EMPTY,
  startSession: (words, mode = "both") =>
    set({
      queue: words,
      phase: mode === "sentence" ? "sentence" : "word",
      mode,
      meaningIds: {},
      results: [],
    }),
  setMeaning: (word, meaningId) =>
    set((s) => ({ meaningIds: { ...s.meaningIds, [word]: meaningId } })),
  setPhase: (phase) => set({ phase }),
  recordResult: (word, step, outcome, display) =>
    set((s) => ({
      results: [...s.results, { word, display, step, outcome }],
    })),
  reset: () => set({ ...EMPTY }),
}));

export function nextWord(queue: string[], word: string): string | null {
  const i = queue.indexOf(word);
  return i >= 0 && i < queue.length - 1 ? (queue[i + 1] ?? null) : null;
}

export function parsePracticeMode(value: string | null): PracticeMode {
  return value === "word" || value === "sentence" ? value : "both";
}

export function firstStepPath({
  word,
  mode,
}: {
  word: string;
  mode: PracticeMode;
}): string {
  const path = `/practice/${encodeURIComponent(word)}`;
  return mode === "sentence" ? `${path}/sentence?m=` : path;
}
