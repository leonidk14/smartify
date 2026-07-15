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
