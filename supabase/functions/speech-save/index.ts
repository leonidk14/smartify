import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  isRecord,
  jsonResponse,
} from "../_shared/http.ts";
import { createUserClient } from "../_shared/supabase.ts";
import { rowToSpeechEntry, type SpeechRow } from "../_shared/speechRows.ts";
import type {
  SpeechSuggestion,
  SuggestionAlternative,
  TranscriptSegment,
} from "../_shared/speechTypes.ts";

const MAX_TRANSCRIPT_CHARACTERS = 500;

interface SaveRequest {
  title: string;
  transcript: string;
  wordCount: number;
  durationSeconds: number | null;
  segments: TranscriptSegment[];
  suggestions: SpeechSuggestion[];
}

function isTranscriptSegment(value: unknown): value is TranscriptSegment {
  if (!isRecord(value)) {
    return false;
  }
  const { text, suggestionId } = value;
  return (
    typeof text === "string" &&
    (suggestionId === null || typeof suggestionId === "string")
  );
}

function isSuggestionAlternative(
  value: unknown,
): value is SuggestionAlternative {
  if (!isRecord(value)) {
    return false;
  }
  const { phrase, register, inSentence, vocabularyWord } = value;
  return (
    typeof phrase === "string" &&
    typeof register === "string" &&
    typeof inSentence === "string" &&
    typeof vocabularyWord === "string"
  );
}

function isSpeechSuggestion(value: unknown): value is SpeechSuggestion {
  if (!isRecord(value)) {
    return false;
  }
  const { id, original, alternatives } = value;
  return (
    typeof id === "string" &&
    typeof original === "string" &&
    Array.isArray(alternatives) &&
    alternatives.every(isSuggestionAlternative)
  );
}

function isSaveRequest(body: unknown): body is SaveRequest {
  if (!isRecord(body)) {
    return false;
  }
  const {
    title,
    transcript,
    wordCount,
    durationSeconds,
    segments,
    suggestions,
  } = body;
  return (
    typeof title === "string" &&
    title.trim() !== "" &&
    typeof transcript === "string" &&
    transcript.trim() !== "" &&
    transcript.length <= MAX_TRANSCRIPT_CHARACTERS &&
    typeof wordCount === "number" &&
    Number.isInteger(wordCount) &&
    wordCount >= 0 &&
    (durationSeconds === null ||
      (typeof durationSeconds === "number" && durationSeconds >= 0)) &&
    Array.isArray(segments) &&
    segments.every(isTranscriptSegment) &&
    Array.isArray(suggestions) &&
    suggestions.every(isSpeechSuggestion)
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

  if (!isSaveRequest(body)) {
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
    title: body.title.trim(),
    transcript: body.transcript,
    segments: body.segments,
    suggestions: body.suggestions,
    duration_seconds: body.durationSeconds,
    word_count: body.wordCount,
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
