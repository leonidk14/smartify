-- Follow-up to 20260730120200_vocabulary_typed.sql (split out because that migration
-- was already pushed). The `authenticated` UPDATE grant on vocabulary is column-scoped
-- (see 20260730120000_vocabulary_ownership.sql) and `typed` was not in it. PostgREST
-- compiles an upsert into `on conflict do update set <every column sent>`, and Postgres
-- checks column privileges at plan time, so the missing one failed every save with
-- 42501 (permission denied). INSERT is table-wide, so only UPDATE needs the per-column
-- grant; unlike `is_public`, there is no reason to withhold `typed`.
grant update (typed) on public.vocabulary to authenticated;
