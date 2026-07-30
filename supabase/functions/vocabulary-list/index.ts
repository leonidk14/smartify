import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  jsonResponse,
} from "../_shared/http.ts";
import { createUserClient } from "../_shared/supabase.ts";
import { preferOwnRows } from "../_shared/vocabularyAccess.ts";
import { rowsToStore, type VocabularyRow } from "../_shared/vocabularyRows.ts";

// Deliberately callable while signed out — an anonymous caller sends the anon key and
// the select policy answers with the public words. There is no filter here: RLS is it.
serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  const supabase = createUserClient(req);
  const { data, error } = await supabase
    .from("vocabulary")
    .select("*")
    .returns<VocabularyRow[]>();

  if (error) {
    console.error(error);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  const rows = preferOwnRows({
    visibleRows: data ?? [],
    userId: user?.id ?? null,
  });

  return jsonResponse({ store: rowsToStore(rows) });
});
