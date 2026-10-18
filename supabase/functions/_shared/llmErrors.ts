import { jsonResponse } from "./http.ts";

// Imported by handler.ts, and so by every function: keep the Anthropic SDK out of
// this module, or the functions that never call a model would bundle it too.

export type LlmErrorCode =
  | "no_llm_access"
  | "key_rejected"
  | "key_unreadable"
  | "key_out_of_credit"
  | "key_rate_limited";

const LLM_ERRORS: Record<LlmErrorCode, { status: number; message: string }> = {
  no_llm_access: {
    status: 403,
    message:
      "This needs your own Anthropic API key or access granted by the admin",
  },
  key_rejected: {
    status: 403,
    message: "Anthropic rejected your API key; save a working one",
  },
  key_unreadable: {
    status: 403,
    message: "Your saved API key could not be read; save it again",
  },
  key_out_of_credit: {
    status: 402,
    message: "Your Anthropic account is out of credit",
  },
  key_rate_limited: {
    status: 429,
    message: "Your Anthropic API key is rate limited; try again shortly",
  },
};

export class LlmAccessError extends Error {
  readonly code: LlmErrorCode;

  constructor(code: LlmErrorCode) {
    super(LLM_ERRORS[code].message);
    this.name = "LlmAccessError";
    this.code = code;
  }
}

export function llmErrorResponse(error: LlmAccessError): Response {
  return jsonResponse(
    { error: error.message, code: error.code },
    LLM_ERRORS[error.code].status,
  );
}
