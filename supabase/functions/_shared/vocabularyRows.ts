// Mirrors the client-side vocabulary types (app/routes/wordSearch/vocabulary.ts):
// the `groups` JSONB payload is opaque here, only the scalar columns are mapped.
export interface VocabularyEntry {
  groups: unknown[];
  display?: string;
  typed?: string;
  shouldPracticeLater: boolean;
  savedAt: string;
  isPublic: boolean;
}

export type VocabularyStore = Record<string, VocabularyEntry>;

export interface VocabularyRow {
  user_id: string;
  word: string;
  display: string | null;
  typed: string | null;
  groups: unknown[];
  should_practice_later: boolean;
  saved_at: string;
  is_public: boolean;
}

// Takes only the columns it reads, so callers holding a row that has not been written
// yet (and so has no server-assigned is_public) don't have to invent one — such a row is
// always a fresh private save, so is_public defaults to false.
export function rowToEntry(
  row: Omit<VocabularyRow, "user_id" | "is_public"> & { is_public?: boolean },
): VocabularyEntry {
  return {
    groups: row.groups,
    display: row.display ?? row.word,
    typed: row.typed ?? undefined,
    shouldPracticeLater: row.should_practice_later,
    savedAt: row.saved_at,
    isPublic: row.is_public ?? false,
  };
}

export function rowsToStore(rows: VocabularyRow[]): VocabularyStore {
  const store: VocabularyStore = {};
  for (const row of rows) {
    store[row.word] = rowToEntry(row);
  }
  return store;
}
