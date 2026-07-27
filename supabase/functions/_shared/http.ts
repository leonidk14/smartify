export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// Generic 500 body. Validation (4xx) messages describe the caller's own payload
// and stay specific; anything originating server-side collapses to this.
export const INTERNAL_ERROR = "Internal error";
