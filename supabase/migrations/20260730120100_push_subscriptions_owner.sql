-- Reminders name words from the vocabulary, so a subscription has to know whose words
-- it may name. No policies: the table stays service-role only, since send-reminders is
-- cron-driven and carries no user JWT for RLS to read.

alter table public.push_subscriptions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

do $$
declare owner_id uuid;
begin
  select id into owner_id from auth.users where email = 'leonid.kaida@outlook.com';

  if owner_id is null then
    if exists (select 1 from public.push_subscriptions) then
      raise exception 'push_subscriptions backfill owner leonid.kaida@outlook.com not found';
    end if;
    return;
  end if;

  update public.push_subscriptions set user_id = owner_id where user_id is null;
end $$;

alter table public.push_subscriptions alter column user_id set not null;

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);
