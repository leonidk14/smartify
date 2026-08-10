import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { PracticePreview } from "./practice/practicePreview";
import { parsePracticeMode } from "../store/session";
import { useVocabulary } from "./wordSearch/useVocabulary";

export default function PracticePreviewRoute() {
  const { store } = useVocabulary();
  const [searchParams] = useSearchParams();

  const mode = parsePracticeMode(searchParams.get("mode"));

  const words = useMemo(() => {
    const keys = (searchParams.get("words") ?? "")
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);

    return keys.map((word) => {
      const entry = store[word];
      const display = (entry?.display?.toLowerCase() ?? word).replace(
        /^./,
        (c) => c.toUpperCase(),
      );
      return { word, display };
    });
  }, [searchParams, store]);

  return <PracticePreview words={words} mode={mode} />;
}
