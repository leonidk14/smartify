import axios from "axios";
import { supabase } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function requireSupabaseConfig(): { url: string; anonKey: string } {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.",
    );
  }
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}

// Signed-in requests carry the user's access token so the LLM edge functions can
// authorize them; signed-out requests fall back to the anon key (and those
// functions 401). `apikey` stays the anon key — the gateway always requires it.
async function authHeaders(
  anonKey: string,
  extraHeaders: Record<string, string>,
): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token ?? anonKey;
  return {
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };
}

export async function postFunction<T = unknown>(
  name: string,
  payload: unknown = {},
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  const { url, anonKey } = requireSupabaseConfig();

  const response = await axios.post<T>(`${url}/functions/v1/${name}`, payload, {
    headers: await authHeaders(anonKey, extraHeaders),
  });
  return response.data;
}

export async function getFunction<T = unknown>(
  name: string,
  pathSegment: string,
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  const { url, anonKey } = requireSupabaseConfig();

  const response = await axios.get<T>(
    `${url}/functions/v1/${name}/${encodeURIComponent(pathSegment)}`,
    { headers: await authHeaders(anonKey, extraHeaders) },
  );
  return response.data;
}
