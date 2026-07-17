import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { PracticeSelect } from "./practice/practiceSelect";
import type { PracticeMode } from "../store/session";
import { useVocabulary } from "./wordSearch/useVocabulary";

export default function PracticeSelectRoute() {
  const { store } = useVocabulary();
  const [searchParams] = useSearchParams();

  const words = useMemo(
    () =>
      Object.entries(store)
        .filter(([, entry]) => entry.groups.length > 0)
        .sort(
          ([, a], [, b]) =>
            new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
        ),
    [store],
  );

  const requested = searchParams.get("mode");
  const mode: PracticeMode =
    requested === "word" || requested === "sentence" ? requested : "both";

  return <PracticeSelect words={words} mode={mode} />;
}
