const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173"];

function getAllowedOrigins(): string[] {
  const configured = Deno.env.get("ALLOWED_ORIGINS");
  if (!configured) {
    return DEFAULT_ALLOWED_ORIGINS;
  }
  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

// `Access-Control-Allow-Origin` takes a single origin, so echo the request's
// Origin back only when it is allowed; otherwise the header is omitted and the
// browser blocks the response.
export function corsHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-lookup-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };

  const origin = req.headers.get("Origin");
  if (origin && getAllowedOrigins().includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}
