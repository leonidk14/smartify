-- Raw phrase the user typed at lookup time (e.g. "applied", "a car"), kept for
-- reference. `display` now holds the normalized headword ("to apply") and `word`
-- its slug ("to-apply"), so neither preserves what was actually typed. Nullable:
-- pre-existing rows have no record of the original input. Not shown in the UI yet.
alter table public.vocabulary
  add column if not exists typed text;
