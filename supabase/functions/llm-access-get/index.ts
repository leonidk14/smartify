import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { readLlmAccessSummary } from "../_shared/llmAccess.ts";

// The browser has no grant on the tables behind this, so it is the only way for
// the app to learn who pays for a user's calls and which key is stored.
serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const accessSummary = await readLlmAccessSummary(user.id);

  return jsonResponse(accessSummary);
});
