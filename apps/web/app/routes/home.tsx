import { useMemo } from "react";
import type { Route } from "./+types/home";
import { readTextField } from "../lib/formData";
import { lookupWord } from "./wordSearch/actions";
import { toKey } from "./wordSearch/normalize";
import {
  deleteWord,
  readVocabulary,
  saveWord,
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

  const preCached = store[toKey(searchItem)];
  if (preCached && preCached.groups.length > 0) {
    return toCachedResult(preCached, toKey(searchItem));
  }

  const result = await lookupWord(searchItem);

  if (result.dictionary.groups.length === 0) {
    return {
      ...result,
      originalSearchItem: searchItem,
      shouldPracticeLater: false,
    };
  }

  const normalizedDisplay = (result.dictionary.normalized || searchItem)
    .trim()
    .toLowerCase();
  const key = toKey(normalizedDisplay);

  const existing = store[key];
  if (existing && existing.groups.length > 0) {
    return toCachedResult(existing, key);
  }

  const saved = await saveWord({
    word: key,
    display: normalizedDisplay,
    typed: searchItem,
    groups: result.dictionary.groups,
  });

  return {
    ...result,
    dictionary: { ...result.dictionary, groups: saved.groups },
    originalSearchItem: searchItem,
    normalizedDisplay,
    shouldPracticeLater: false,
    isPublic: saved.isPublic,
    key,
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
