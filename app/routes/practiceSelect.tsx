import { readVocabulary } from "./wordSearch/vocabulary";
import { PracticeSelect } from "./practice/practiceSelect";
import type { PracticeMode } from "../store/session";
import type { Route } from "./+types/practiceSelect";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const { store: vocabulary } = await readVocabulary();
  const words = Object.entries(vocabulary)
    .filter(([, entry]) => entry.groups.length > 0)
    .sort(
      ([, a], [, b]) =>
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
    );

  const requested = new URL(request.url).searchParams.get("mode");
  const mode: PracticeMode =
    requested === "word" || requested === "sentence" ? requested : "both";

  return { words, mode };
}

export default function PracticeSelectRoute({
  loaderData,
}: Route.ComponentProps) {
  return <PracticeSelect words={loaderData.words} mode={loaderData.mode} />;
}
