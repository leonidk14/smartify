import { create } from "zustand";

type Phase = "word" | "sentence";
export type PracticeMode = "word" | "sentence" | "both";

export interface StepResult {
  word: string;
  step: Phase;
  correct: boolean;
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
  recordResult: (word: string, step: Phase, correct: boolean) => void;
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
  recordResult: (word, step, correct) =>
    set((s) => ({ results: [...s.results, { word, step, correct }] })),
  reset: () => set({ ...EMPTY }),
}));

export function nextWord(queue: string[], word: string): string | null {
  const i = queue.indexOf(word);
  return i >= 0 && i < queue.length - 1 ? queue[i + 1] : null;
}
