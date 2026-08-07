-- Adds per-word delete, absent by design until now (see the closing note of
-- 20260730120000_vocabulary_ownership.sql). DELETE is table-wide, so unlike UPDATE it
-- needs no per-column grant.
grant delete on public.vocabulary to authenticated;

-- Mirrors vocabulary_update: `using` scopes deletes to the caller's own rows (an attempt
-- at someone else's row matches zero rows instead of erroring), and `is_public = false`
-- makes the shared public words undeletable by anyone — including their owner.
create policy vocabulary_delete on public.vocabulary
  for delete to authenticated
  using (user_id = (select auth.uid()) and is_public = false);
