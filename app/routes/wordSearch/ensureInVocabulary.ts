import { lookupWord, type LookupResult } from "./actions";
import { toKey } from "./normalize";
import {
  saveWord,
  type VocabularyEntry,
  type VocabularyStore,
} from "./vocabulary";

export type EnsuredWord =
  | { kind: "existing"; key: string; entry: VocabularyEntry }
  | {
      kind: "saved";
      key: string;
      display: string;
      entry: VocabularyEntry;
      lookup: LookupResult;
    }
  | { kind: "notFound"; lookup: LookupResult };

function findDefinedEntry({
  store,
  key,
}: {
  store: VocabularyStore;
  key: string;
}): VocabularyEntry | undefined {
  const entry = store[key];
  return entry !== undefined && entry.groups.length > 0 ? entry : undefined;
}

export async function ensureInVocabulary({
  word,
  store,
}: {
  word: string;
  store: VocabularyStore;
}): Promise<EnsuredWord> {
  const wordKey = toKey(word);
  const vocabularyEntry = findDefinedEntry({ store, key: wordKey });
  if (vocabularyEntry !== undefined) {
    return { kind: "existing", key: wordKey, entry: vocabularyEntry };
  }

  const lookup = await lookupWord(word);
  if (lookup.dictionary.groups.length === 0) {
    return { kind: "notFound", lookup };
  }

  const display = (lookup.dictionary.normalized || word).trim().toLowerCase();
  const key = toKey(display);
  const normalizedEntry = findDefinedEntry({ store, key });
  if (normalizedEntry !== undefined) {
    return { kind: "existing", key, entry: normalizedEntry };
  }

  const entry = await saveWord({
    word: key,
    display,
    typed: word,
    groups: lookup.dictionary.groups,
  });
  return { kind: "saved", key, display, entry, lookup };
}
