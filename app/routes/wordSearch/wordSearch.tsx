import { VocabularyHome } from "./vocabularyHome";
import { LookupPanel } from "./lookupPanel";
import type { VocabularyEntry } from "./vocabulary";
import { useNavigate, useSearchParams } from "react-router";

const LOOKUP_PARAM = "lookup";

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isLookupOpen = searchParams.has(LOOKUP_PARAM);
  const lookupQuery = searchParams.get(LOOKUP_PARAM) ?? undefined;

  const openLookup = (query?: string) => {
    const search = new URLSearchParams({ [LOOKUP_PARAM]: query ?? "" });
    void navigate({ pathname: "/", search: `?${search.toString()}` });
  };

  const closeLookup = () => {
    void navigate("/", { replace: true });
  };

  return (
    <>
      <VocabularyHome
        words={words}
        total={total}
        dueCount={dueCount}
        isFromOfflineCopy={isFromOfflineCopy}
        onOpenLookup={openLookup}
      />
      {isLookupOpen ? (
        <LookupPanel
          savedWords={words}
          initialQuery={lookupQuery}
          onClose={closeLookup}
        />
      ) : null}
    </>
  );
};
