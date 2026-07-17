import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { rowToEntry, type VocabularyRow } from "../_shared/vocabularyRows.ts";

interface SaveBody {
  word?: unknown;
  display?: unknown;
  groups?: unknown;
}

// TODO(auth): scope to the authenticated user once auth exists.
serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let body: SaveBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const word = body.word;
  const display = body.display;
  const groups = body.groups;

  if (typeof word !== "string" || !word.trim() || !Array.isArray(groups)) {
    return errorResponse("Expected { word: string, groups: array }");
  }

  const key = word.trim().toLowerCase();
  const row: VocabularyRow = {
    word: key,
    display:
      typeof display === "string" && display.trim()
        ? display.trim().toLowerCase()
        : key,
    groups,
    should_practice_later: false,
    saved_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("vocabulary")
    .upsert(row, { onConflict: "word" });

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ entry: rowToEntry(row) });
});
