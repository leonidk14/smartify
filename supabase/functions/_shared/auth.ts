import { createClient, type User } from "npm:@supabase/supabase-js@2";
import { requireEnv } from "./env.ts";

// Resolves the caller from the request's `Authorization: Bearer <jwt>` header.
// A signed-out client sends the anon key, which is a valid project JWT (so it
// passes the gateway's verify_jwt) but is not a user token — `getUser` returns
// no user, so we return null and callers 401.
export async function getRequestUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const client = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_ANON_KEY"),
    { auth: { persistSession: false } },
  );

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return data.user;
}
