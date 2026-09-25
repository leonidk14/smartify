import { ensureInVocabulary } from "../wordSearch/ensureInVocabulary";
import {
  readVocabulary,
  setPracticeLater,
  type VocabularyStore,
} from "../wordSearch/vocabulary";

// What the keep screen shows when saving stops short of finishing the review.
// Words that did save stay saved, so retrying re-runs every ticked word: the
// ones already in the vocabulary are only marked for practice again.
export type KeepSaveFailure =
  { reason: "words"; failedWords: string[] } | { reason: "finish" };

export interface KeptWords {
  failedWords: string[];
  notFoundWords: string[];
}

type KeepOutcome = "kept" | "notFound" | "failed";

async function keepWord({
  word,
  store,
}: {
  word: string;
  store: VocabularyStore;
}): Promise<KeepOutcome> {
  try {
    const ensured = await ensureInVocabulary({ word, store });
    if (ensured.kind === "notFound") {
      return "notFound";
    }
    await setPracticeLater({ word: ensured.key, shouldPracticeLater: true });
    return "kept";
  } catch (error) {
    console.error(`Failed to keep "${word}"`, error);
    return "failed";
  }
}

export async function keepWords(words: string[]): Promise<KeptWords> {
  const uniqueWords = [...new Set(words)];

  let store: VocabularyStore;
  try {
    store = (await readVocabulary()).store;
  } catch (error) {
    console.error("Failed to read the vocabulary before keeping words", error);
    return { failedWords: uniqueWords, notFoundWords: [] };
  }

  const results = await Promise.all(
    uniqueWords.map(async (word) => ({
      word,
      outcome: await keepWord({ word, store }),
    })),
  );

  return {
    failedWords: results
      .filter(({ outcome }) => outcome === "failed")
      .map(({ word }) => word),
    notFoundWords: results
      .filter(({ outcome }) => outcome === "notFound")
      .map(({ word }) => word),
  };
}
