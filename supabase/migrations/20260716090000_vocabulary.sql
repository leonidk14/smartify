-- TODO(auth): add `user_id uuid references auth.users`, make the primary key
-- (user_id, word), and add per-user RLS policies. Single-user for now.
create table if not exists public.vocabulary (
  word text primary key,
  groups jsonb not null default '[]'::jsonb,
  should_practice_later boolean not null default false,
  saved_at timestamptz not null default now()
);

-- No policies added, so only the service role (the Edge Functions) can access it.
alter table public.vocabulary enable row level security;

create index if not exists vocabulary_should_practice_later_idx
  on public.vocabulary (should_practice_later)
  where should_practice_later;

-- Private bucket holding the vocabulary seed snapshot as a fallback/restore
-- source (uploaded by scripts/seed-vocabulary.mjs).
insert into storage.buckets (id, name, public)
values ('seeds', 'seeds', false)
on conflict (id) do nothing;
