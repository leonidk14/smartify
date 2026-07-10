import { readVocabulary } from "./wordSearch/vocabulary";
import { PracticeList } from "./practice/practiceList";
import type { Route } from "./+types/practice";

export async function clientLoader() {
  const vocabulary = await readVocabulary();
  const words = Object.entries(vocabulary)
    .filter(([, entry]) => entry.groups.length > 0)
    .sort(
      ([, a], [, b]) =>
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    );
  return { words };
}

export default function Practice({ loaderData }: Route.ComponentProps) {
  return <PracticeList words={loaderData.words} />;
}
