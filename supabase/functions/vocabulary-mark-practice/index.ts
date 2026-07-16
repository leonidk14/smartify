import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";

interface MarkPracticeBody {
  word?: unknown;
}

// TODO(auth): scope to the authenticated user once auth exists.
serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let body: MarkPracticeBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const word = body.word;
  if (typeof word !== "string" || !word.trim()) {
    return errorResponse("Expected { word: string }");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("vocabulary")
    .update({ should_practice_later: true })
    .eq("word", word.trim().toLowerCase());

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ ok: true });
});
