import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  jsonResponse,
} from "../_shared/http.ts";
import { createUserClient } from "../_shared/supabase.ts";
import { rowToSpeechEntry, type SpeechRow } from "../_shared/speechRows.ts";

// Mirrors app/routes/speech/speechConstants.ts's MAX_TRANSCRIPT_CHARACTERS — Deno
// functions can't import from app/, so the 500-character rule is duplicated here.
const MAX_TRANSCRIPT_CHARACTERS = 500;

interface SaveBody {
  title?: unknown;
  transcript?: unknown;
  wordCount?: unknown;
  durationSeconds?: unknown;
  segments?: unknown;
  suggestions?: unknown;
}

function isValidDuration(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && value >= 0);
}

serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  let body: SaveBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const {
    title,
    transcript,
    wordCount,
    durationSeconds,
    segments,
    suggestions,
  } = body;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof transcript !== "string" ||
    !transcript.trim() ||
    transcript.length > MAX_TRANSCRIPT_CHARACTERS ||
    typeof wordCount !== "number" ||
    !Number.isInteger(wordCount) ||
    wordCount < 0 ||
    !isValidDuration(durationSeconds) ||
    !Array.isArray(segments) ||
    !Array.isArray(suggestions)
  ) {
    return errorResponse(
      "Expected { title: string, transcript: string, wordCount: number, " +
        "durationSeconds: number | null, segments: array, suggestions: array }",
    );
  }

  const row: Omit<
    SpeechRow,
    "id" | "chosen_alternatives" | "reviewed_at" | "created_at"
  > = {
    owner: user.id,
    title: title.trim(),
    transcript,
    segments,
    suggestions,
    duration_seconds: durationSeconds,
    word_count: wordCount,
  };

  const supabase = createUserClient(req);
  const { data, error } = await supabase
    .from("speeches")
    .insert(row)
    .select()
    .returns<SpeechRow[]>();

  const inserted = data?.[0];
  if (error || !inserted) {
    console.error(error);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  return jsonResponse({ entry: rowToSpeechEntry(inserted) });
});
