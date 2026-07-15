-- Scheduled "Ready to practice?" reminders.
--
-- pg_cron only runs SQL inside Postgres; to actually run the send-reminders Edge
-- Function it makes an outbound HTTP POST (via pg_net) to the function's public
-- URL, with an `Authorization: Bearer` header. The anon key is enough here — it
-- is a valid JWT (so it passes the function's verify_jwt gate), and the function
-- does its DB work with its own service-role key internally. The anon key is not
-- secret (it already ships in the client bundle), so both values are inlined
-- below; replace them with this project's URL + anon key before enabling.
--
-- For now reminders are triggered MANUALLY by POSTing to the function, e.g.:
--   curl -X POST "$VITE_SUPABASE_URL/functions/v1/send-reminders" \
--     -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" -d '{}'
-- The daily schedule below stays commented until we go live.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- TODO: enable the daily reminder. 18:00 in UTC+2 == 16:00 UTC.
-- select cron.schedule(
--   'send-reminders-daily',
--   '0 16 * * *',
--   $$
--   select net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/send-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <anon-key>'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
