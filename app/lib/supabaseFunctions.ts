import axios from "axios";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function postFunction<T = unknown>(
  name: string,
  payload: unknown = {},
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.",
    );
  }

  const response = await axios.post<T>(
    `${SUPABASE_URL}/functions/v1/${name}`,
    payload,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        ...extraHeaders,
      },
    },
  );
  return response.data;
}

export async function getFunction<T = unknown>(
  name: string,
  pathSegment: string,
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.",
    );
  }

  const response = await axios.get<T>(
    `${SUPABASE_URL}/functions/v1/${name}/${encodeURIComponent(pathSegment)}`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        ...extraHeaders,
      },
    },
  );
  return response.data;
}
