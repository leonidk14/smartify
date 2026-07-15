import { corsHeaders } from "./cors.ts";
import { errorResponse } from "./http.ts";

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
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Unexpected error";
      return withCors(errorResponse(message, 500), cors);
    }
  });
}
