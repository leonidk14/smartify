import axios from "axios";
import { postFunction } from "../../lib/supabaseFunctions";

// Mirrors LlmAccessSummary in supabase/functions/_shared/llmAccess.ts.
export type KeySource = "own" | "admin" | "none";

export interface SavedLlmKey {
  hint: string;
  status: "valid" | "rejected";
  savedAt: string;
}

export interface LlmAccessSummary {
  keySource: KeySource;
  key: SavedLlmKey | null;
}

const KEY_REJECTED_CODE = "key_rejected";

export function getLlmAccess(): Promise<LlmAccessSummary> {
  return postFunction<LlmAccessSummary>("llm-access-get");
}

export function saveLlmKey(key: string): Promise<LlmAccessSummary> {
  return postFunction<LlmAccessSummary>("llm-key-save", { key });
}

export function removeLlmKey(): Promise<LlmAccessSummary> {
  return postFunction<LlmAccessSummary>("llm-key-delete");
}

function isKeyRejectedResponse(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    data.code === KEY_REJECTED_CODE
  );
}

export function keySaveFailureMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response === undefined) {
    return "No connection — try again.";
  }
  if (
    axios.isAxiosError(error) &&
    isKeyRejectedResponse(error.response?.data)
  ) {
    return "Anthropic didn’t accept this key. Check it was copied in full, or create a new one.";
  }
  return "Something went wrong — try again.";
}
