import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { PracticeSelect } from "./practice/practiceSelect";
import { parsePreselect } from "./practice/preselect";
import { parsePracticeMode } from "../store/session";
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

  const mode = parsePracticeMode(searchParams.get("mode"));
  const preselect = parsePreselect(searchParams.get("preselect"));

  return <PracticeSelect words={words} mode={mode} preselect={preselect} />;
}
