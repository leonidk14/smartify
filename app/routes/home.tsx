import type { Route } from "../+types/root";
import { lookupWord } from "./wordSearch/actions";
import { WordSearch } from "./wordSearch/wordSearch";

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();

  const searchItem = String(formData.get("search-item"));

  if (!searchItem) {
    console.error("Search item is not found");

    return null;
  }

  const result = await lookupWord(searchItem);
  console.log("result", result);

  return "bla";
}

export default function Home() {
  return <WordSearch />;
}
