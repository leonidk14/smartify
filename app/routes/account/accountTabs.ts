import type { LlmAccessSummary } from "./llmAccessApi";

export type AccountTab = "data" | "key";

export function hasBrokenKey(access: LlmAccessSummary): boolean {
  return access.key?.status === "rejected";
}

export function defaultAccountTab(access: LlmAccessSummary): AccountTab {
  return access.keySource === "none" || hasBrokenKey(access) ? "key" : "data";
}

export function accountTabFromPath(pathname: string): AccountTab | null {
  if (pathname.startsWith("/account/key")) {
    return "key";
  }
  if (pathname.startsWith("/account/data")) {
    return "data";
  }
  return null;
}
