import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  jsonResponse,
} from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";

interface MarkPracticeBody {
  word?: unknown;
  shouldPracticeLater?: unknown;
}

serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
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

  const shouldPracticeLater = body.shouldPracticeLater;
  if (
    shouldPracticeLater !== undefined &&
    typeof shouldPracticeLater !== "boolean"
  ) {
    return errorResponse("Expected { shouldPracticeLater?: boolean }");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("vocabulary")
    .update({ should_practice_later: shouldPracticeLater ?? true })
    .eq("word", word.trim().toLowerCase());

  if (error) {
    console.error(error);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  return jsonResponse({ ok: true });
});
