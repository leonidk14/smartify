import Anthropic from "npm:@anthropic-ai/sdk@0.110.0";
import { getRequestUser } from "../_shared/auth.ts";
import { requireEnv } from "../_shared/env.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  jsonResponse,
} from "../_shared/http.ts";
import type { TokenUsage } from "../_shared/usage.ts";
import { type AnalysisModel, analyzeTranscript } from "./analysis.ts";
import { anchorSuggestions, type RawSuggestion } from "./anchoring.ts";
import { sharpenMock } from "./mock.ts";

const MAX_TRANSCRIPT_CHARACTERS = 500;

interface SharpenBody {
  transcript?: unknown;
}

function formatUsage(usage: TokenUsage): string {
  return `in:${usage.inputTokens} out:${usage.outputTokens} cost:${usage.totalCost}`;
}

function anchorAndRespond({
  transcript,
  raw,
  usage,
  source,
}: {
  transcript: string;
  raw: RawSuggestion[];
  usage: TokenUsage;
  source: string;
}): Response {
  const { segments, suggestions, droppedCount } = anchorSuggestions({
    transcript,
    raw,
  });

  console.log(
    `[sharpen] (${source}) — ${formatUsage(usage)} dropped:${droppedCount}`,
  );

  return jsonResponse({ segments, suggestions, usage, source });
}

serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  let body: SharpenBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { transcript } = body;
  if (
    typeof transcript !== "string" ||
    !transcript.trim() ||
    transcript.length > MAX_TRANSCRIPT_CHARACTERS
  ) {
    return errorResponse("Expected { transcript: string }");
  }

  // "real" runs Haiku with a Sonnet retry; "haiku"/"sonnet" pin one model.
  // Any other value stays mock so the default never spends tokens.
  const sharpenMode = (Deno.env.get("SHARPEN_MODE") ?? "").toLowerCase();
  if (
    sharpenMode !== "real" &&
    sharpenMode !== "haiku" &&
    sharpenMode !== "sonnet"
  ) {
    const mock = await sharpenMock();
    return anchorAndRespond({
      transcript,
      raw: mock.suggestions,
      usage: mock.usage,
      source: "mock",
    });
  }

  const model: AnalysisModel = sharpenMode === "real" ? "auto" : sharpenMode;
  const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  const { outcome, usage, source } = await analyzeTranscript({
    client,
    transcript,
    model,
  });

  if (outcome.status !== "ok") {
    console.error(
      `[sharpen] (${source}) — ${
        formatUsage(usage)
      } failed, ${outcome.status}: ${outcome.reason}`,
    );
    return errorResponse(INTERNAL_ERROR, 502);
  }

  return anchorAndRespond({
    transcript,
    raw: outcome.suggestions,
    usage,
    source,
  });
});
