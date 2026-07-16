import { readVocabulary } from "./wordSearch/vocabulary";
import { PracticeStart } from "./practice/practiceStart";
import type { Route } from "./+types/practice";

export async function clientLoader() {
  const { store: vocabulary } = await readVocabulary();
  const entries = Object.values(vocabulary).filter(
    (entry) => entry.groups.length > 0,
  );
  const markedCount = entries.filter((e) => e.shouldPracticeLater).length;
  return { total: entries.length, markedCount };
}

export default function Practice({ loaderData }: Route.ComponentProps) {
  return (
    <PracticeStart
      total={loaderData.total}
      markedCount={loaderData.markedCount}
    />
  );
}
