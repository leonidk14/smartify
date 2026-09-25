import { useMemo } from "react";
import type { Route } from "./+types/home";
import { readTextField } from "../lib/formData";
import { ensureInVocabulary } from "./wordSearch/ensureInVocabulary";
import { toKey } from "./wordSearch/normalize";
import {
  deleteWord,
  readVocabulary,
  setPracticeLater,
  type VocabularyEntry,
} from "./wordSearch/vocabulary";
import { useVocabulary } from "./wordSearch/useVocabulary";
import { WordSearch } from "./wordSearch/wordSearch";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "practice") {
    const word = readTextField(formData, "word");
    await setPracticeLater({
      word: toKey(word),
      shouldPracticeLater: formData.get("shouldPracticeLater") === "true",
    });
    return { success: true };
  }

  if (intent === "delete") {
    const word = readTextField(formData, "word");
    await deleteWord({ word: toKey(word) });
    return { success: true };
  }

  const searchItem = readTextField(formData, "search-item");

  if (!searchItem) {
    console.error("Search item is not found");
    return null;
  }

  const toCachedResult = (entry: VocabularyEntry, key: string) => ({
    dictionary: { groups: entry.groups },
    originalSearchItem: searchItem,
    normalizedDisplay: entry.display ?? toKey(searchItem),
    shouldPracticeLater: entry.shouldPracticeLater,
    isPublic: entry.isPublic,
    key,
  });

  const { store } = await readVocabulary();
  const ensured = await ensureInVocabulary({ word: searchItem, store });

  if (ensured.kind === "existing") {
    return toCachedResult(ensured.entry, ensured.key);
  }

  if (ensured.kind === "notFound") {
    return {
      ...ensured.lookup,
      originalSearchItem: searchItem,
      shouldPracticeLater: false,
    };
  }

  return {
    ...ensured.lookup,
    dictionary: { ...ensured.lookup.dictionary, groups: ensured.entry.groups },
    originalSearchItem: searchItem,
    normalizedDisplay: ensured.display,
    shouldPracticeLater: false,
    isPublic: ensured.entry.isPublic,
    key: ensured.key,
  };
}

export default function Home() {
  const { store, isFromOfflineCopy } = useVocabulary();

  const { words, dueCount } = useMemo(() => {
    const words = Object.entries(store)
      .filter(([, entry]) => entry.groups.length > 0)
      .sort(
        ([, a], [, b]) =>
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
      );
    const dueCount = words.filter(
      ([, entry]) => entry.shouldPracticeLater,
    ).length;
    return { words, dueCount };
  }, [store]);

  return (
    <WordSearch
      words={words}
      total={words.length}
      dueCount={dueCount}
      isFromOfflineCopy={isFromOfflineCopy}
    />
  );
}
