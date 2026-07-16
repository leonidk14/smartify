import { useState } from "react";
import { VocabularyHome } from "./vocabularyHome";
import { LookupPanel } from "./lookupPanel";
import type { VocabularyEntry } from "./vocabulary";

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
