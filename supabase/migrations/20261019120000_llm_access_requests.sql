-- Shared-key requests. A user without a working key asks to run on the admin's key,
-- with an optional note; the admin answers each one by hand from the SQL editor.
--
-- A request is history, never access. Only a row in llm_admin_grants lets a call
-- spend the admin's key, and approve_llm_access_request below is the one path from
-- the first to the second.
--
-- The admin's routine, run as postgres in the SQL editor:
--
--   select id, user_id, email, note, created_at
--     from public.llm_access_requests
--    where status = 'pending'
--    order by created_at;
--
--   select public.approve_llm_access_request('<id>');
--   select public.decline_llm_access_request('<id>', 'Optional reason for the user');
--
-- Decide by user_id: email is the address the account had when it asked, and an
-- account can change its address. Revoking access later is unchanged:
--
--   delete from public.llm_admin_grants where user_id = '<user_id>';

create table public.llm_access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Taken from the caller's verified JWT, never from the request body.
  email text not null,
  note text check (char_length(note) between 1 and 500),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined')),
  decision_reason text check (char_length(decision_reason) between 1 and 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check ((status = 'pending') = (resolved_at is null))
);

-- At most one open request per user. Withdrawing one deletes it, so only answered
-- requests accumulate as history.
create unique index llm_access_requests_one_pending_idx
  on public.llm_access_requests (user_id)
  where status = 'pending';

create index llm_access_requests_user_created_at_idx
  on public.llm_access_requests (user_id, created_at desc);

-- Service-role only, like the other llm_* tables: no policies, no browser grants.
alter table public.llm_access_requests enable row level security;

revoke all on public.llm_access_requests from anon, authenticated;

-- No update: only the admin's helpers below answer a request.
grant select, insert, delete on public.llm_access_requests to service_role;

-- Both helpers stay SECURITY INVOKER and executable by postgres alone. Never make
-- them SECURITY DEFINER and never grant them to anon or authenticated: together,
-- those two changes would let any user approve their own request.
create function public.approve_llm_access_request(request_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  requester uuid;
begin
  update public.llm_access_requests
     set status = 'approved',
         resolved_at = now()
   where id = request_id
     and status = 'pending'
  returning user_id into requester;

  if requester is null then
    raise exception 'llm access request % is not pending', request_id;
  end if;

  insert into public.llm_admin_grants (user_id)
  values (requester)
  on conflict (user_id) do nothing;
end;
$$;

create function public.decline_llm_access_request(
  request_id uuid,
  reason text default null
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.llm_access_requests
     set status = 'declined',
         resolved_at = now(),
         decision_reason = nullif(btrim(reason), '')
   where id = request_id
     and status = 'pending';

  if not found then
    raise exception 'llm access request % is not pending', request_id;
  end if;
end;
$$;

revoke all on function public.approve_llm_access_request(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.decline_llm_access_request(uuid, text)
  from public, anon, authenticated, service_role;
