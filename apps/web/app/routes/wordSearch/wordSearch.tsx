import { useCallback, useEffect, useState } from "react";
import { VocabularyHome } from "./vocabularyHome";
import { LookupPanel } from "./lookupPanel";
import type { VocabularyEntry } from "./vocabulary";
import { useBlocker, type BlockerFunction } from "react-router";

interface WordSearchProps {
  words: [string, VocabularyEntry][];
  total: number;
  dueCount: number;
  isFromOfflineCopy: boolean;
}

export const WordSearch = ({
  words,
  total,
  dueCount,
  isFromOfflineCopy,
}: WordSearchProps) => {
  const [lookup, setLookup] = useState<{ open: boolean; query?: string }>({
    open: false,
  });

  const shouldBlock = useCallback<BlockerFunction>(
    ({ historyAction }) => {
      return lookup.open && historyAction === "POP";
    },
    [lookup.open],
  );

  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state === "blocked") {
      setLookup({ open: false });
      blocker.reset();
    }
  }, [blocker]);

  return (
    <>
      <VocabularyHome
        words={words}
        total={total}
        dueCount={dueCount}
        isFromOfflineCopy={isFromOfflineCopy}
        onOpenLookup={(query) => setLookup({ open: true, query })}
      />
      {lookup.open ? (
        <LookupPanel
          savedWords={words}
          initialQuery={lookup.query}
          onClose={() => setLookup({ open: false })}
        />
      ) : null}
    </>
  );
};
