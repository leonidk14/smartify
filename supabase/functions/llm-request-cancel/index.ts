import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { readLlmAccessSummary } from "../_shared/llmAccess.ts";
import { deletePendingAdminKeyRequest } from "../_shared/llmAccessRequests.ts";
import { createAdminClient } from "../_shared/supabase.ts";

serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  await deletePendingAdminKeyRequest({
    supabase: createAdminClient(),
    userId: user.id,
  });

  const accessSummary = await readLlmAccessSummary(user.id);

  return jsonResponse(accessSummary);
});
