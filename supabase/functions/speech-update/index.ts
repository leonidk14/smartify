import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  isRecord,
  jsonResponse,
} from "../_shared/http.ts";
import { createUserClient } from "../_shared/supabase.ts";
import type { SpeechRow } from "../_shared/speechRows.ts";
import type { ChosenAlternatives } from "../_shared/speechTypes.ts";

interface UpdateRequest {
  id: string;
  chosenAlternatives: ChosenAlternatives;
}

function isChosenAlternatives(value: unknown): value is ChosenAlternatives {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (index) =>
        typeof index === "number" && Number.isInteger(index) && index >= 0,
    )
  );
}

function isUpdateRequest(body: unknown): body is UpdateRequest {
  if (!isRecord(body)) {
    return false;
  }
  const { id, chosenAlternatives } = body;
  return (
    typeof id === "string" &&
    id.trim() !== "" &&
    isChosenAlternatives(chosenAlternatives)
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  if (!isUpdateRequest(body)) {
    return errorResponse(
      "Expected { id: string, chosenAlternatives: { [suggestionId]: number } }",
    );
  }

  const changes: Pick<SpeechRow, "chosen_alternatives" | "reviewed_at"> = {
    chosen_alternatives: body.chosenAlternatives,
    reviewed_at: new Date().toISOString(),
  };

  const supabase = createUserClient(req);
  const { data, error } = await supabase
    .from("speeches")
    .update(changes)
    .eq("id", body.id)
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
