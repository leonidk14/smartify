import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const UNIQUE_VIOLATION = "23505";

export type LlmAccessRequestStatus = "pending" | "approved" | "declined";

export interface StoredLlmAccessRequest {
  id: string;
  user_id: string;
  email: string;
  note: string | null;
  status: LlmAccessRequestStatus;
  decision_reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

export async function readLatestAdminKeyRequest({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<StoredLlmAccessRequest | null> {
  const { data, error } = await supabase
    .from("llm_access_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<StoredLlmAccessRequest[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data[0] ?? null;
}

export async function insertPendingAdminKeyRequest({
  supabase,
  userId,
  email,
  note,
}: {
  supabase: SupabaseClient;
  userId: string;
  email: string;
  note: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from("llm_access_requests")
    .insert({ user_id: userId, email, note });

  if (error && error.code !== UNIQUE_VIOLATION) {
    throw new Error(error.message);
  }
}

export async function deletePendingAdminKeyRequest({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<void> {
  const { error } = await supabase
    .from("llm_access_requests")
    .delete()
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }
}
