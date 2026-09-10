export interface SpeechRow {
  id: string;
  owner: string;
  title: string;
  transcript: string;
  segments: unknown;
  suggestions: unknown;
  chosen_alternatives: unknown;
  duration_seconds: number | null;
  word_count: number;
  reviewed_at: string | null;
  created_at: string;
}

export interface SpeechEntry {
  id: string;
  title: string;
  transcript: string;
  segments: unknown;
  suggestions: unknown;
  chosenAlternatives: unknown;
  durationSeconds: number | null;
  wordCount: number;
  reviewedAt: string | null;
  createdAt: string;
}

export function rowToSpeechEntry(row: SpeechRow): SpeechEntry {
  return {
    id: row.id,
    title: row.title,
    transcript: row.transcript,
    segments: row.segments,
    suggestions: row.suggestions,
    chosenAlternatives: row.chosen_alternatives,
    durationSeconds: row.duration_seconds,
    wordCount: row.word_count,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}
