import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  jsonResponse,
} from "../_shared/http.ts";
import { createUserClient } from "../_shared/supabase.ts";
import { rowToSpeechEntry, type SpeechRow } from "../_shared/speechRows.ts";

serveFunction(async (req) => {
  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const match = new URLPattern({ pathname: "*/speech-get/:id" }).exec(req.url);
  const id = match?.pathname.groups.id;
  if (!id) {
    return errorResponse("Expected /speech-get/<id>");
  }

  const supabase = createUserClient(req);

  const { data, error } = await supabase
    .from("speeches")
    .select("*")
    .eq("id", id)
    .returns<SpeechRow[]>();

  if (error) {
    console.error(error);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  const row = data?.[0];
  if (!row) {
    return errorResponse("Not found", 404);
  }

  return jsonResponse({ entry: rowToSpeechEntry(row) });
});
