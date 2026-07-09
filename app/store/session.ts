import { create } from "zustand";

type Phase = "word" | "sentence";

interface SessionState {
  queue: string[];
  phase: Phase;
  meaningIds: Record<string, string>;
  scores: Record<string, number>;
  startSession: (words: string[]) => void;
  setMeaning: (word: string, meaningId: string) => void;
  setPhase: (phase: Phase) => void;
  recordScore: (word: string, score: number) => void;
  reset: () => void;
}

const EMPTY = {
  queue: [],
  phase: "word" as Phase,
  meaningIds: {},
  scores: {},
};

export const useSessionStore = create<SessionState>((set) => ({
  ...EMPTY,
  startSession: (words) =>
    set({ queue: words, phase: "word", meaningIds: {}, scores: {} }),
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
