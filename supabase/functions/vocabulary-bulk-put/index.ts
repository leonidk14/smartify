import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import {
  entryToRow,
  isEntry,
  type VocabularyRow,
} from "../_shared/vocabularyRows.ts";

interface BulkPutBody {
  store?: unknown;
}

// TODO(auth): scope to the authenticated user once auth exists.
serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let body: BulkPutBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const store = body.store;
  if (typeof store !== "object" || store === null || Array.isArray(store)) {
    return errorResponse("Expected { store: Record<word, entry> }");
  }

  const rows: VocabularyRow[] = [];
  for (const [word, entry] of Object.entries(store)) {
    if (!word.trim() || !isEntry(entry)) {
      return errorResponse(`Invalid entry for word "${word}"`);
    }
    rows.push(entryToRow(word.trim().toLowerCase(), entry));
  }

  if (rows.length === 0) {
    return jsonResponse({ ok: true, count: 0 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("vocabulary")
    .upsert(rows, { onConflict: "word" });

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ ok: true, count: rows.length });
});
