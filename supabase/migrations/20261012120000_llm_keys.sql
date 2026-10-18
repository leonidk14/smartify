-- Bring-your-own-key. Who pays for a user's LLM calls is derived per request, never
-- stored: a row in user_api_keys means the user's own Anthropic key, otherwise a row in
-- llm_admin_grants means the admin's key, otherwise the call is refused. A stored key
-- always wins over a grant, and nothing falls back from one to the other.

create table public.user_api_keys (
  -- Regenerated whenever the key is replaced, so llm_usage can tell two keys apart.
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  -- AES-256-GCM, encrypted in the edge function (_shared/llmKeyCrypto.ts) under the
  -- LLM_KEY_ENCRYPTION_KEY_V<key_version> function secret. Postgres never sees the key.
  ciphertext text not null,
  iv text not null,
  key_version smallint not null,
  -- The key's last four characters, kept readable so a key can be named without
  -- decrypting it.
  key_hint text not null,
  status text not null default 'valid' check (status in ('valid', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.llm_admin_grants (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

-- One row per Anthropic call, not per request: a Haiku attempt retried on Sonnet is two
-- billable calls with two request ids.
create table public.llm_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  function_name text not null,
  key_source text not null check (key_source in ('own', 'admin')),
  -- user_api_keys.id at call time. Deliberately not a foreign key: these rows outlive
  -- a deleted or replaced key.
  key_id uuid,
  key_hint text,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  status text not null,
  anthropic_request_id text,
  created_at timestamptz not null default now()
);

-- No policies on any of the three: only the edge functions reach them, through the
-- service role. A stored key in particular has no read path from the browser at all.
alter table public.user_api_keys enable row level security;
alter table public.llm_admin_grants enable row level security;
alter table public.llm_usage enable row level security;

revoke all on public.user_api_keys from anon, authenticated;
revoke all on public.llm_admin_grants from anon, authenticated;
revoke all on public.llm_usage from anon, authenticated;

-- Spelled out because config.toml leaves `auto_expose_new_tables` unset: new tables
-- get no Data API grants at all, the service role included, and bypassing RLS does not
-- bypass table privileges.
grant select, insert, update, delete on public.user_api_keys to service_role;
grant select, delete on public.llm_admin_grants to service_role;
grant select, insert on public.llm_usage to service_role;

-- Everyone who already has an account keeps today's behaviour. Accounts created later
-- start with neither a key nor a grant.
insert into public.llm_admin_grants (user_id)
select id from auth.users
on conflict (user_id) do nothing;
