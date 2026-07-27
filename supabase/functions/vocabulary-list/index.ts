import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  jsonResponse,
} from "../_shared/http.ts";
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
    console.error(error);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  return jsonResponse({ store: rowsToStore((data ?? []) as VocabularyRow[]) });
});
