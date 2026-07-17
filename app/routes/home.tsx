import { useMemo } from "react";
import type { Route } from "./+types/home";
import { lookupWord } from "./wordSearch/actions";
import { normalize } from "./wordSearch/normalize";
import {
  markForPractice,
  readVocabulary,
  saveWord,
} from "./wordSearch/vocabulary";
import { useVocabulary } from "./wordSearch/useVocabulary";
import { WordSearch } from "./wordSearch/wordSearch";

export async function clientAction({ request }: Route.ClientActionArgs) {
  let formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "practice") {
    const word = String(formData.get("word"));
    await markForPractice(normalize(word));
    return { success: true };
  }

  const searchItem = String(formData.get("search-item"));

  if (!searchItem) {
    console.error("Search item is not found");
    return null;
  }

  const key = normalize(searchItem);
  const { store } = await readVocabulary();
  const cached = store[key];

  if (cached && cached.groups.length > 0) {
    return {
      dictionary: { groups: cached.groups },
      originalSearchItem: searchItem,
      shouldPracticeLater: cached.shouldPracticeLater,
    };
  }

  const result = await lookupWord(searchItem);

  if (result.dictionary.groups.length === 0) {
    return {
      ...result,
      originalSearchItem: searchItem,
      shouldPracticeLater: false,
    };
  }

  const saved = await saveWord({
    word: key,
    display: searchItem.trim().toLowerCase(),
    groups: result.dictionary.groups,
  });

  return {
    ...result,
    dictionary: { ...result.dictionary, groups: saved.groups },
    originalSearchItem: searchItem,
    shouldPracticeLater: false,
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
