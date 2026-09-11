import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { anchorSuggestions } from "./anchoring.ts";
import { sharpenMock } from "./mock.ts";

const MAX_TRANSCRIPT_CHARACTERS = 500;

interface SharpenBody {
  transcript?: unknown;
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

  const { suggestions: raw, usage } = await sharpenMock();
  const { segments, suggestions, droppedCount } = anchorSuggestions({
    transcript,
    raw,
  });

  console.log(
    `[sharpen] (mock) — in:${usage.inputTokens} out:${usage.outputTokens} cost:${usage.totalCost} dropped:${droppedCount}`,
  );

  return jsonResponse({ segments, suggestions, usage, source: "mock" });
});
