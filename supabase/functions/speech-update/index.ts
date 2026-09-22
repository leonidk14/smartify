import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  jsonResponse,
} from "../_shared/http.ts";
import { createUserClient } from "../_shared/supabase.ts";
import type { SpeechRow } from "../_shared/speechRows.ts";

interface UpdateBody {
  id?: unknown;
  chosenAlternatives?: unknown;
}

function isChosenAlternatives(
  value: unknown,
): value is Record<string, number> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (index) =>
        typeof index === "number" && Number.isInteger(index) && index >= 0,
    )
  );
}

serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  let body: UpdateBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { id, chosenAlternatives } = body;
  if (
    typeof id !== "string" ||
    !id.trim() ||
    !isChosenAlternatives(chosenAlternatives)
  ) {
    return errorResponse(
      "Expected { id: string, chosenAlternatives: { [suggestionId]: number } }",
    );
  }

  const changes: Pick<SpeechRow, "chosen_alternatives" | "reviewed_at"> = {
    chosen_alternatives: chosenAlternatives,
    reviewed_at: new Date().toISOString(),
  };

  const supabase = createUserClient(req);
  const { data, error } = await supabase
    .from("speeches")
    .update(changes)
    .eq("id", id)
    .select("id")
    .returns<Pick<SpeechRow, "id">[]>();

  if (error) {
    console.error(error);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  // RLS turns an update of someone else's row into a zero-row match rather than
  // an error, so an empty result is the only sign the row isn't the caller's.
  if (!data?.length) {
    return errorResponse("Not found", 404);
  }

  return jsonResponse({ ok: true });
});
