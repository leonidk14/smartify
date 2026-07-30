-- Supersedes the TODO(auth) header of 20260716090000_vocabulary.sql: words are now
-- owned by the user who saved them and visible only to them, except for a small
-- fixed set flagged `is_public` that everyone (including signed-out visitors) sees.

alter table public.vocabulary
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists is_public boolean not null default false;

-- Backfill. `owner_id` is a block-local variable; auth.users is GoTrue's own table,
-- only read here. On an empty database (a fresh `supabase db reset`) there is nothing
-- to own, so a missing account is not an error.
do $$
declare owner_id uuid;
begin
  select id into owner_id from auth.users where email = 'leonid.kaida@outlook.com';

  if owner_id is null then
    if exists (select 1 from public.vocabulary) then
      raise exception 'vocabulary backfill owner leonid.kaida@outlook.com not found';
    end if;
    return;
  end if;

  update public.vocabulary set user_id = owner_id where user_id is null;

  update public.vocabulary set is_public = true
    where word in (select word from public.vocabulary order by saved_at, word limit 5);
end $$;

alter table public.vocabulary alter column user_id set not null;

-- Dropped by lookup rather than by the assumed `vocabulary_pkey`, so a differently
-- named constraint can't fail the push halfway through.
do $$
declare pk_name text;
begin
  select conname into pk_name
    from pg_constraint
    where conrelid = 'public.vocabulary'::regclass and contype = 'p';

  if pk_name is not null then
    execute format('alter table public.vocabulary drop constraint %I', pk_name);
  end if;
end $$;

alter table public.vocabulary add primary key (user_id, word);

create index if not exists vocabulary_public_word_idx
  on public.vocabulary (word)
  where is_public;

-- Grants and RLS are ANDed: a caller needs the privilege *and* a permitting policy.
-- Revoking first is load-bearing — a column-level `grant update (...)` narrows nothing
-- while the table-wide UPDATE from Supabase's default privileges is still in place.
revoke all on public.vocabulary from anon, authenticated;

grant select on public.vocabulary to anon, authenticated;
grant insert on public.vocabulary to authenticated;
-- `is_public` is omitted: that is what makes it immutable to clients, so nobody can
-- publish a word to everyone. The key columns are listed because PostgREST compiles an
-- upsert into `on conflict do update set <every column sent>` — including the conflict
-- target — and Postgres checks column privileges when it plans the statement, so a
-- missing one fails every save rather than only the conflicting ones. Ownership still
-- can't move: the update policy pins user_id to auth.uid() before and after.
grant update (user_id, word, display, groups, should_practice_later, saved_at)
  on public.vocabulary to authenticated;

-- (select auth.uid()) rather than a bare call: Postgres evaluates it once per statement
-- as an InitPlan instead of once per row.
create policy vocabulary_select on public.vocabulary
  for select to anon, authenticated
  using (is_public or user_id = (select auth.uid()));

create policy vocabulary_insert on public.vocabulary
  for insert to authenticated
  with check (user_id = (select auth.uid()) and is_public = false);

-- `using` is what makes copy-on-write work: an update aimed at someone else's public
-- row matches zero rows instead of mutating shared data, and the edge function forks
-- a private copy on that signal.
create policy vocabulary_update on public.vocabulary
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- No delete grant and no delete policy: deleting a word is not a feature yet.
