import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { requireEnv } from "./env.ts";

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected into the function
// runtime by Supabase. The service role bypasses RLS — server-side use only.
export function createAdminClient(): SupabaseClient {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
}

// Forwards the caller's Authorization header so Postgres sees their JWT and RLS
// applies. A signed-out caller sends the anon key, which resolves to a null
// auth.uid() — the vocabulary select policy then yields exactly the public words.
export function createUserClient(req: Request): SupabaseClient {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_ANON_KEY"),
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
      auth: { persistSession: false },
    },
  );
}
