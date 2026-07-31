import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  jsonResponse,
} from "../_shared/http.ts";
import { createUserClient } from "../_shared/supabase.ts";
import { rowToEntry, type VocabularyRow } from "../_shared/vocabularyRows.ts";

interface SaveBody {
  word?: unknown;
  display?: unknown;
  typed?: unknown;
  groups?: unknown;
}

serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  let body: SaveBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const word = body.word;
  const display = body.display;
  const typed = body.typed;
  const groups = body.groups;

  if (typeof word !== "string" || !word.trim() || !Array.isArray(groups)) {
    return errorResponse("Expected { word: string, groups: array }");
  }

  const key = word.trim().toLowerCase();
  // `is_public` is left out on purpose. It defaults to false, and sending it would put
  // it in the upsert's `on conflict do update set` list — a column clients have no
  // update privilege on, which would fail every re-save of an own public word.
  const row: Omit<VocabularyRow, "is_public"> = {
    user_id: user.id,
    word: key,
    display: typeof display === "string" && display.trim()
      ? display.trim().toLowerCase()
      : key,
    typed: typeof typed === "string" && typed.trim()
      ? typed.trim().toLowerCase()
      : null,
    groups,
    should_practice_later: false,
    saved_at: new Date().toISOString(),
  };

  const supabase = createUserClient(req);
  const { error } = await supabase
    .from("vocabulary")
    .upsert(row, { onConflict: "user_id,word" });

  if (error) {
    console.error(error);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  return jsonResponse({ entry: rowToEntry(row) });
});
