import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, isRecord, jsonResponse } from "../_shared/http.ts";
import { readLlmAccessSummary } from "../_shared/llmAccess.ts";
import { insertPendingAdminKeyRequest } from "../_shared/llmAccessRequests.ts";
import { createAdminClient } from "../_shared/supabase.ts";

const MAX_NOTE_CHARACTERS = 500;

function isOptionalNote(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

// Asks the admin to let this user run on the admin's key. The request goes out
// under the account's email from the verified JWT; the body carries only the note.
serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  if (!isRecord(body) || !isOptionalNote(body.note)) {
    return errorResponse("Expected { note?: string | null }");
  }

  const trimmedNote = body.note?.trim() ?? "";

  if (trimmedNote.length > MAX_NOTE_CHARACTERS) {
    return errorResponse(
      `Expected a note of at most ${MAX_NOTE_CHARACTERS} characters`,
    );
  }
  if (!user.email) {
    return errorResponse("Your account has no email address to send it from");
  }

  const currentSummary = await readLlmAccessSummary(user.id);
  if (currentSummary.keySource === "admin") {
    return errorResponse("You already have access to the shared key", 409);
  }

  await insertPendingAdminKeyRequest({
    supabase: createAdminClient(),
    userId: user.id,
    email: user.email,
    note: trimmedNote.length > 0 ? trimmedNote : null,
  });

  const accessSummary = await readLlmAccessSummary(user.id);

  return jsonResponse(accessSummary);
});
