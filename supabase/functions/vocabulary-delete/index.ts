import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  jsonResponse,
} from "../_shared/http.ts";
import { createUserClient } from "../_shared/supabase.ts";

interface DeleteBody {
  word?: unknown;
}

serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  let body: DeleteBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const word = body.word;
  if (typeof word !== "string" || !word.trim()) {
    return errorResponse("Expected { word: string }");
  }

  const key = word.trim().toLowerCase();
  const supabase = createUserClient(req);

  const { error } = await supabase.from("vocabulary").delete().eq("word", key);

  if (error) {
    console.error(error);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  return jsonResponse({ ok: true });
});
