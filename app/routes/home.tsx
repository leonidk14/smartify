import type { Route } from "../+types/root";
import { WordSearch } from "./wordSearch/wordSearch";

export async function action({ request }: Route.ActionArgs) {
  let formData = await request.formData();

  console.log("formData", formData);

  return "bla";
}

export default function Home() {
  return <WordSearch />;
}
