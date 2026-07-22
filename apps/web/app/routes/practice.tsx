import { useMemo } from "react";
import { PracticeStart } from "./practice/practiceStart";
import { useVocabulary } from "./wordSearch/useVocabulary";

export default function Practice() {
  const { store } = useVocabulary();

  const { total, markedCount } = useMemo(() => {
    const entries = Object.values(store).filter(
      (entry) => entry.groups.length > 0,
    );
    return {
      total: entries.length,
      markedCount: entries.filter((e) => e.shouldPracticeLater).length,
    };
  }, [store]);

  return <PracticeStart total={total} markedCount={markedCount} />;
}
