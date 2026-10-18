import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  jsonResponse,
} from "../_shared/http.ts";
import { readLlmAccessSummary } from "../_shared/llmAccess.ts";
import { createAdminClient } from "../_shared/supabase.ts";

serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const { error } = await createAdminClient()
    .from("user_api_keys")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  const accessSummary = await readLlmAccessSummary(user.id);

  return jsonResponse(accessSummary);
});
