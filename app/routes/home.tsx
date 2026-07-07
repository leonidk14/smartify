import type { Route } from "../+types/root";
import { lookupWord } from "./wordSearch/actions";
import {
  markForPractice,
  readVocabulary,
  saveWord,
} from "./wordSearch/vocabulary.server";
import { WordSearch } from "./wordSearch/wordSearch";

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "practice") {
    const word = String(formData.get("word"));
    await markForPractice(word);
    return { success: true };
  }

  const searchItem = String(formData.get("search-item"));

  if (!searchItem) {
    console.error("Search item is not found");
    return null;
  }

  const key = searchItem.trim().toLowerCase();
  const store = await readVocabulary();
  const cached = store[key];

  if (cached) {
    return {
      dictionary: { groups: cached.groups },
      originalSearchItem: searchItem,
      shouldPracticeLater: cached.shouldPracticeLater,
    };
  }

  const result = await lookupWord(searchItem);
  await saveWord(searchItem, result.dictionary.groups);

  return {
    ...result,
    originalSearchItem: searchItem,
    shouldPracticeLater: false,
  };
}

export default function Home() {
  return <WordSearch />;
}
