create table public.speeches (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  title text not null,
  transcript text not null,
  segments jsonb not null default '[]'::jsonb,
  suggestions jsonb not null default '[]'::jsonb,
  chosen_alternatives jsonb not null default '{}'::jsonb,
  duration_seconds integer,
  word_count integer not null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.speeches enable row level security;

create index speeches_owner_created_at_idx
  on public.speeches (owner, created_at desc);

revoke all on public.speeches from anon, authenticated;

grant select, insert on public.speeches to authenticated;

grant update (chosen_alternatives, reviewed_at) on public.speeches to authenticated;

create policy speeches_select on public.speeches
  for select to authenticated
  using (owner = (select auth.uid()));

create policy speeches_insert on public.speeches
  for insert to authenticated
  with check (owner = (select auth.uid()));

create policy speeches_update on public.speeches
  for update to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));
