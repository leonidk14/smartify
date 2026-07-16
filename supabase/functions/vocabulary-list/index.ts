import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { rowsToStore, type VocabularyRow } from "../_shared/vocabularyRows.ts";

// TODO(auth): scope to the authenticated user once auth exists.
serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("vocabulary").select("*");

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ store: rowsToStore((data ?? []) as VocabularyRow[]) });
});
