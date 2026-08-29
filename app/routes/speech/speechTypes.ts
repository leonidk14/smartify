export type Register = "neutral" | "formal" | "plain";

export interface SuggestionAlternative {
  phrase: string;
  register: Register;
  // The user's own sentence with `phrase` substituted for the suggestion's
  // `original`, shown so the fit can be judged in context rather than in
  // isolation.
  inSentence: string;
  // The dictionary headword to look up when this alternative is saved —
  // distinct from `phrase`, which may not be a lookupable form on its own
  // ("markedly smoother" doesn't look up; "markedly" does).
  vocabularyWord: string;
}

export interface SpeechSuggestion {
  id: string;
  original: string;
  // Always exactly three: one neutral, one formal, one plain, in that order.
  alternatives: SuggestionAlternative[];
}

export interface TranscriptSegment {
  text: string;
  suggestionId: string | null;
}

export interface SpeechRecording {
  id: string;
  title: string;
  transcript: string;
  // Concatenating every segment's `text`, in order, reproduces `transcript`
  // exactly — rendering marks this way needs no offset arithmetic.
  segments: TranscriptSegment[];
  suggestions: SpeechSuggestion[];
  durationSeconds: number;
  // The vocabularyWords the user has picked to add. `savedWords.length > 0`
  // is what derives the "N SAVED" / "NOT REVIEWED" badge — no separate flag.
  savedWords: string[];
  createdAt: string;
}

// layout.tsx reads the `/speech/:id` route's loaderData via useMatches() to
// render that screen's header, and useMatches() types match data as unknown
// — this is what narrows it back to a SpeechRecording.
export function isSpeechRecording(value: unknown): value is SpeechRecording {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "transcript" in value &&
    "createdAt" in value
  );
}
