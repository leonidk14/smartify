// Mirrors the client-side vocabulary types (app/routes/wordSearch/vocabulary.ts):
// the `groups` JSONB payload is opaque here, only the scalar columns are mapped.
export interface VocabularyEntry {
  groups: unknown[];
  shouldPracticeLater: boolean;
  savedAt: string;
}

export type VocabularyStore = Record<string, VocabularyEntry>;

export interface VocabularyRow {
  word: string;
  groups: unknown[];
  should_practice_later: boolean;
  saved_at: string;
}

export function rowToEntry(row: VocabularyRow): VocabularyEntry {
  return {
    groups: row.groups,
    shouldPracticeLater: row.should_practice_later,
    savedAt: row.saved_at,
  };
}

export function rowsToStore(rows: VocabularyRow[]): VocabularyStore {
  const store: VocabularyStore = {};
  for (const row of rows) {
    store[row.word] = rowToEntry(row);
  }
  return store;
}

export function entryToRow(
  word: string,
  entry: VocabularyEntry,
): VocabularyRow {
  return {
    word,
    groups: entry.groups,
    should_practice_later: entry.shouldPracticeLater,
    saved_at: entry.savedAt,
  };
}

export function isEntry(value: unknown): value is VocabularyEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as Partial<VocabularyEntry>;
  return (
    Array.isArray(entry.groups) &&
    typeof entry.shouldPracticeLater === "boolean" &&
    typeof entry.savedAt === "string"
  );
}
