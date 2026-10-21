import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  isRecord,
  jsonResponse,
} from "../_shared/http.ts";
import {
  readLlmAccessSummary,
  tryAccessAnthropic,
} from "../_shared/llmAccess.ts";
import { deletePendingAdminKeyRequest } from "../_shared/llmAccessRequests.ts";
import type { LlmErrorCode } from "../_shared/llmErrors.ts";
import { encryptLlmKey } from "../_shared/llmKeyCrypto.ts";
import { createAdminClient } from "../_shared/supabase.ts";

const KEY_PREFIX = "sk-ant-";
const ADMIN_KEY_PREFIX = "sk-ant-admin";
const KEY_HINT_LENGTH = 4;

const REJECTED_CODE: LlmErrorCode = "key_rejected";

// The key travels in the body, never in the URL, and is never echoed back: the
// response carries only its last characters.
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

  if (!isRecord(body) || typeof body.key !== "string") {
    return errorResponse("Expected { key: string }");
  }

  const apiKey = body.key.trim();

  if (!apiKey.startsWith(KEY_PREFIX)) {
    return errorResponse(
      `Expected an Anthropic API key starting with ${KEY_PREFIX}`,
    );
  }
  // An Admin API key manages an organization's members, workspaces and API
  // keys. This app only ever calls a model, so refusing one keeps a leak here
  // from reaching that far.
  if (apiKey.startsWith(ADMIN_KEY_PREFIX)) {
    return errorResponse(
      "Admin API keys are not accepted; create a regular API key",
    );
  }

  const anthropicResponse = await tryAccessAnthropic(apiKey);
  if (!anthropicResponse) {
    return jsonResponse(
      { error: "Anthropic rejected this API key", code: REJECTED_CODE },
      400,
    );
  }

  const encrypted = await encryptLlmKey({ userId: user.id, apiKey });
  const supabase = createAdminClient();

  const { error: keyError } = await supabase.from("user_api_keys").upsert(
    {
      id: crypto.randomUUID(),
      user_id: user.id,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      key_version: encrypted.keyVersion,
      key_hint: apiKey.slice(-KEY_HINT_LENGTH),
      status: "valid",
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (keyError) {
    console.error(keyError);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  // Key first, admin grant second
  const { error: grantError } = await supabase
    .from("llm_admin_grants")
    .delete()
    .eq("user_id", user.id);

  if (grantError) {
    console.error(grantError);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  await deletePendingAdminKeyRequest({ supabase, userId: user.id });

  const accessSummary = await readLlmAccessSummary(user.id);

  return jsonResponse(accessSummary);
});
