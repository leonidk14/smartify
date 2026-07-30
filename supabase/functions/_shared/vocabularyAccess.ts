import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { VocabularyRow } from "./vocabularyRows.ts";

// Precedence, not access control — `rows` must already be narrowed to what the caller
// may see (RLS, or the explicit filter in the cron path). A forked word arrives twice,
// as the public row plus the caller's copy, so keep one row per word with theirs
// winning. An unforked public row is kept as-is: that is what makes the shared words
// visible to everyone.
export function preferOwnRows<T extends { user_id: string; word: string }>({
  visibleRows,
  userId,
}: {
  visibleRows: T[];
  userId: string | null;
}): T[] {
  const preferredRowByWord = new Map<string, T>();

  for (const row of visibleRows) {
    const isOwn = row.user_id === userId;
    if (isOwn || !preferredRowByWord.has(row.word)) {
      preferredRowByWord.set(row.word, row);
    }
  }

  return [...preferredRowByWord.values()];
}

// A write must never land on someone else's public row. Returns the caller's own row
// for `word`, forking a private copy of the public one the first time they write to
// it, or null when the word is not visible to them at all. `is_public` is left to its
// column default — clients have no privilege to set it.
export async function ensureOwnedWord({
  supabase,
  userId,
  word,
}: {
  supabase: SupabaseClient;
  userId: string;
  word: string;
}): Promise<VocabularyRow | null> {
  // No .maybeSingle(): it throws as soon as a caller holds both the public row and a
  // fork of it. RLS has already narrowed this to rows the caller may see.
  const { data, error: readError } = await supabase
    .from("vocabulary")
    .select("*")
    .eq("word", word)
    .returns<VocabularyRow[]>();

  if (readError) {
    throw new Error(readError.message);
  }

  const visible =
    preferOwnRows({ visibleRows: data ?? [], userId })[0] ?? null;
  if (visible === null || visible.user_id === userId) {
    return visible;
  }

  const fork = {
    user_id: userId,
    word: visible.word,
    display: visible.display,
    groups: visible.groups,
    should_practice_later: visible.should_practice_later,
    saved_at: visible.saved_at,
  };

  // ignoreDuplicates compiles to `on conflict do nothing`, so two concurrent forks
  // cannot collide and no update privilege is needed.
  const { error } = await supabase
    .from("vocabulary")
    .upsert(fork, { onConflict: "user_id,word", ignoreDuplicates: true });

  if (error) {
    throw new Error(error.message);
  }

  return { ...fork, is_public: false };
}
