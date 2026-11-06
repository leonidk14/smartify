-- Resolves account emails to user ids for send-reminders' targeted sends. auth.users
-- is not exposed through the Data API, so the edge function reaches it through this
-- function via rpc(), as service_role.
--
-- SECURITY DEFINER: it runs as its owner (postgres), which can read auth.users, so
-- whoever may execute it borrows that read access. Keep it executable by service_role
-- alone. Granted to anon or authenticated, it would let anyone holding the published
-- anon key test which addresses have accounts and learn their ids.
--
-- If service_role can read auth.users itself
-- (`select has_table_privilege('service_role', 'auth.users', 'select')`), this can be
-- SECURITY INVOKER instead and borrow nothing.

create function public.user_ids_by_email(emails text[])
returns table (email text, user_id uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select lower(u.email), u.id
    from auth.users u
   where lower(u.email) = any (emails);
$$;

revoke all on function public.user_ids_by_email(text[])
  from public, anon, authenticated;
grant execute on function public.user_ids_by_email(text[]) to service_role;
