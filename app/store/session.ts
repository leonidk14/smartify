import { create } from "zustand";

type Phase = "word" | "sentence";
export type PracticeMode = "word" | "sentence" | "both";

interface SessionState {
  queue: string[];
  phase: Phase;
  mode: PracticeMode;
  meaningIds: Record<string, string>;
  scores: Record<string, number>;
  startSession: (words: string[], mode?: PracticeMode) => void;
  setMeaning: (word: string, meaningId: string) => void;
  setPhase: (phase: Phase) => void;
  recordScore: (word: string, score: number) => void;
  reset: () => void;
}

const EMPTY = {
  queue: [],
  phase: "word" as Phase,
  mode: "both" as PracticeMode,
  meaningIds: {},
  scores: {},
};

export const useSessionStore = create<SessionState>((set) => ({
  ...EMPTY,
  startSession: (words, mode = "both") =>
    set({
      queue: words,
      phase: mode === "sentence" ? "sentence" : "word",
      mode,
      meaningIds: {},
      scores: {},
    }),
  setMeaning: (word, meaningId) =>
    set((s) => ({ meaningIds: { ...s.meaningIds, [word]: meaningId } })),
  setPhase: (phase) => set({ phase }),
  recordScore: (word, score) =>
    set((s) => ({ scores: { ...s.scores, [word]: score } })),
  reset: () => set({ ...EMPTY }),
}));

export function nextWord(queue: string[], word: string): string | null {
  const i = queue.indexOf(word);
  return i >= 0 && i < queue.length - 1 ? queue[i + 1] : null;
}
