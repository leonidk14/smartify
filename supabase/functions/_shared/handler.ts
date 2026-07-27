import { corsHeaders } from "./cors.ts";
import { errorResponse, INTERNAL_ERROR } from "./http.ts";

function withCors(response: Response, cors: Record<string, string>): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

export function serveFunction(
  handler: (req: Request) => Promise<Response>,
): void {
  Deno.serve(async (req) => {
    const cors = corsHeaders(req);

    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: cors });
    }

    try {
      return withCors(await handler(req), cors);
    } catch (error) {
      // Log the real cause to the function logs, but never return it: raw
      // PostgREST/SDK text leaks table and column names, and requireEnv's
      // message names the missing secret.
      console.error(error);
      return withCors(errorResponse(INTERNAL_ERROR, 500), cors);
    }
  });
}
