// Mirrors the client-side vocabulary types (app/routes/wordSearch/vocabulary.ts):
// the `groups` JSONB payload is opaque here, only the scalar columns are mapped.
export interface VocabularyEntry {
  groups: unknown[];
  display?: string;
  shouldPracticeLater: boolean;
  savedAt: string;
}

export type VocabularyStore = Record<string, VocabularyEntry>;

export interface VocabularyRow {
  user_id: string;
  word: string;
  display: string | null;
  groups: unknown[];
  should_practice_later: boolean;
  saved_at: string;
  is_public: boolean;
}

// Takes only the columns it reads, so callers holding a row that has not been written
// yet (and so has no server-assigned is_public) don't have to invent one.
export function rowToEntry(
  row: Omit<VocabularyRow, "user_id" | "is_public">,
): VocabularyEntry {
  return {
    groups: row.groups,
    display: row.display ?? row.word,
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

