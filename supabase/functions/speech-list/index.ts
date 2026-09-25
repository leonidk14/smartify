import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  jsonResponse,
} from "../_shared/http.ts";
import { createUserClient } from "../_shared/supabase.ts";
import {
  rowToSpeechSummary,
  type SpeechSummaryRow,
} from "../_shared/speechRows.ts";

const SUMMARY_COLUMNS =
  "id, title, duration_seconds, word_count, reviewed_at, created_at";

serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return jsonResponse({ entries: [] });
  }

  const supabase = createUserClient(req);
  const { data, error } = await supabase
    .from("speeches")
    .select(SUMMARY_COLUMNS)
    .order("created_at", { ascending: false })
    .returns<SpeechSummaryRow[]>();

  if (error) {
    console.error(error);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  return jsonResponse({ entries: (data ?? []).map(rowToSpeechSummary) });
});
