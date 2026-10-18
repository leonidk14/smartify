import Anthropic from "npm:@anthropic-ai/sdk@0.110.0";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { requireEnv } from "./env.ts";
import { LlmAccessError, type LlmErrorCode } from "./llmErrors.ts";
import { decryptLlmKey, LlmKeyDecryptionError } from "./llmKeyCrypto.ts";
import { createAdminClient } from "./supabase.ts";
import {
  buildTokenUsage,
  type PricingModel,
  type TokenUsage,
} from "./usage.ts";

// This module is the only place that reads ANTHROPIC_API_KEY or constructs an
// Anthropic client. Every model call goes through sendMessageAndRecordUsage, so the key
// that pays and the ledger row describing it come from one resolved value.

const KEY_VERIFICATION_TIMEOUT_MS = 10_000;

export type KeySource = "own" | "admin" | "none";

export interface StoredLlmKey {
  id: string;
  user_id: string;
  ciphertext: string;
  iv: string;
  key_version: number;
  key_hint: string;
  status: "valid" | "rejected";
  created_at: string;
}

interface AccessContext {
  userId: string;
  functionName: string;
}

type BillableAccess =
  | (AccessContext & { source: "own"; key: StoredLlmKey })
  | (AccessContext & { source: "admin" });

export type LlmAccess =
  | BillableAccess
  | (AccessContext & { source: "blocked"; code: LlmErrorCode });

export interface LlmAccessSummary {
  keySource: KeySource;
  key: {
    hint: string;
    status: StoredLlmKey["status"];
    savedAt: string;
  } | null;
}

type ResolvedKeySource =
  | { source: "own"; key: StoredLlmKey }
  | { source: "admin" | "none" };

async function readStoredKey({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<StoredLlmKey | null> {
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("*")
    .eq("user_id", userId)
    .returns<StoredLlmKey[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data[0] ?? null;
}

async function hasAdminGrant({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<boolean> {
  const { data, error } = await supabase
    .from("llm_admin_grants")
    .select("user_id")
    .eq("user_id", userId)
    .returns<{ user_id: string }[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.length > 0;
}

async function readKeySource(userId: string): Promise<ResolvedKeySource> {
  const supabase = createAdminClient();
  const [key, isAdminGranted] = await Promise.all([
    readStoredKey({ supabase, userId }),
    hasAdminGrant({ supabase, userId }),
  ]);

  if (key !== null) {
    return { source: "own", key };
  }
  return { source: isAdminGranted ? "admin" : "none" };
}

export async function resolveLlmAccess({
  userId,
  functionName,
}: {
  userId: string;
  functionName: string;
}): Promise<LlmAccess> {
  const resolvedKeySource = await readKeySource(userId);
  const context = { userId, functionName };

  if (resolvedKeySource.source !== "own") {
    return resolvedKeySource.source === "admin"
      ? { ...context, source: "admin" }
      : { ...context, source: "blocked", code: "no_llm_access" };
  }
  if (resolvedKeySource.key.status === "rejected") {
    return { ...context, source: "blocked", code: "key_rejected" };
  }
  return { ...context, source: "own", key: resolvedKeySource.key };
}

export async function readLlmAccessSummary(
  userId: string,
): Promise<LlmAccessSummary> {
  const resolved = await readKeySource(userId);

  if (resolved.source !== "own") {
    return { keySource: resolved.source, key: null };
  }
  return {
    keySource: "own",
    key: {
      hint: resolved.key.key_hint,
      status: resolved.key.status,
      savedAt: resolved.key.created_at,
    },
  };
}

export function billedSource(access: LlmAccess): KeySource {
  return access.source === "blocked" ? "none" : access.source;
}

async function decryptStoredKey({
  userId,
  key,
}: {
  userId: string;
  key: StoredLlmKey;
}): Promise<string> {
  try {
    return await decryptLlmKey({
      userId,
      ciphertext: key.ciphertext,
      iv: key.iv,
      keyVersion: key.key_version,
    });
  } catch (error) {
    if (error instanceof LlmKeyDecryptionError) {
      console.error(
        `[llm-access] stored key ${key.id} of user ${userId} did not decrypt`,
      );
      throw new LlmAccessError("key_unreadable");
    }
    throw error;
  }
}

async function openClient(access: BillableAccess): Promise<Anthropic> {
  if (access.source === "admin") {
    return new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  }
  return new Anthropic({
    apiKey: await decryptStoredKey({ userId: access.userId, key: access.key }),
  });
}

// Logged rather than thrown: by the time this runs the call has been made, and
// failing the request would discard a response that is already paid for.
async function recordUsage({
  access,
  model,
  usage,
  status,
  requestId,
}: {
  access: BillableAccess;
  model: string;
  usage: TokenUsage;
  status: string;
  requestId: string | null | undefined;
}): Promise<void> {
  const { error } = await createAdminClient()
    .from("llm_usage")
    .insert({
      user_id: access.userId,
      function_name: access.functionName,
      key_source: access.source,
      key_id: access.source === "own" ? access.key.id : null,
      key_hint: access.source === "own" ? access.key.key_hint : null,
      model,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      cost_usd: usage.totalCost,
      status,
      anthropic_request_id: requestId ?? null,
    });

  if (error) {
    console.error("[llm-usage] could not record a call:", error);
  }
}

async function markKeyRejected(keyId: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("user_api_keys")
    .update({ status: "rejected" })
    .eq("id", keyId);

  if (error) {
    console.error("[llm-access] could not mark a key rejected:", error);
  }
}

// Null means the failure is not one the key's owner can act on. Out-of-credit is
// matched on the API's error type because SDK 0.110.0 has no class for a 402.
function classifyProviderError(error: unknown): LlmErrorCode | null {
  if (error instanceof Anthropic.AuthenticationError) {
    return "key_rejected";
  }
  if (error instanceof Anthropic.RateLimitError) {
    return "key_rate_limited";
  }
  if (error instanceof Anthropic.APIError && error.type === "billing_error") {
    return "key_out_of_credit";
  }
  return null;
}

async function sendMessage({
  access,
  pricing,
  params,
}: {
  access: BillableAccess;
  pricing: PricingModel;
  params: Anthropic.Messages.MessageCreateParamsNonStreaming;
}) {
  const client = await openClient(access);

  try {
    return await client.messages.create(params);
  } catch (error) {
    const code = classifyProviderError(error);

    await recordUsage({
      access,
      model: params.model,
      usage: buildTokenUsage({
        inputTokens: 0,
        outputTokens: 0,
        model: pricing,
      }),
      status: code ?? "error",
      requestId: error instanceof Anthropic.APIError ? error.requestID : null,
    });

    // Only the owner of a key can act on a failure of that key. The same failure
    // on the admin key is an operator fault and stays a generic 500.
    if (access.source === "own" && code !== null) {
      if (code === "key_rejected") {
        await markKeyRejected(access.key.id);
      }
      throw new LlmAccessError(code);
    }
    throw error;
  }
}

// The point of spend. A caller with no usable key is refused here and not
// earlier, so a request that turns out to need no model call never needs one.
export async function sendMessageAndRecordUsage({
  access,
  pricing,
  params,
}: {
  access: LlmAccess;
  pricing: PricingModel;
  params: Anthropic.Messages.MessageCreateParamsNonStreaming;
}): Promise<{ message: Anthropic.Messages.Message; usage: TokenUsage }> {
  if (access.source === "blocked") {
    throw new LlmAccessError(access.code);
  }

  const message = await sendMessage({ access, pricing, params });
  const usage = buildTokenUsage({
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    model: pricing,
  });

  await recordUsage({
    access,
    model: params.model,
    usage,
    status: "ok",
    requestId: message._request_id,
  });

  return { message, usage };
}

// Listing models runs no model and bills no tokens. It shows that Anthropic
// accepts the key, not that the account behind it has credit.
export async function tryAccessAnthropic(apiKey: string): Promise<boolean> {
  const client = new Anthropic({
    apiKey,
    maxRetries: 0,
    timeout: KEY_VERIFICATION_TIMEOUT_MS,
  });

  try {
    await client.models.list({ limit: 1 });
    return true;
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return false;
    }
    throw error;
  }
}
