create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- No policies added, so only the service role (the Edge Functions) can access it.
alter table public.push_subscriptions enable row level security;
