-- Human-readable form of the word, stored verbatim at save time. `word` stays
-- the normalized identity key (spaces -> dashes, articles stripped), which is
-- lossy for display and can't be reversed (a real hyphen like "re-edit" is
-- indistinguishable from a de-dashed space). Nullable: readers fall back to
-- `word` when it's absent.
alter table public.vocabulary
  add column if not exists display text;

-- Best-effort backfill for pre-existing rows (de-dash the key).
update public.vocabulary
  set display = replace(word, '-', ' ')
  where display is null;
