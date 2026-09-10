import { getFunction, postFunction } from "../../lib/supabaseFunctions";
import type { SpeechSuggestion, TranscriptSegment } from "./speechTypes";

export interface SpeechEntry {
  id: string;
  title: string;
  transcript: string;
  segments: TranscriptSegment[];
  suggestions: SpeechSuggestion[];
  // Not yet given a concrete shape — #06/#07 define what a chosen alternative
  // looks like. Every entry ticket 01 creates has none.
  chosenAlternatives: unknown;
  durationSeconds: number | null;
  wordCount: number;
  reviewedAt: string | null;
  createdAt: string;
}

// layout.tsx reads the `/speech/:id` route's loaderData via useMatches() to
// render that screen's header, and useMatches() types match data as unknown —
// this is what narrows it back to a SpeechEntry.
export function isSpeechEntry(value: unknown): value is SpeechEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "transcript" in value &&
    "createdAt" in value
  );
}

export async function saveSpeechEntry(input: {
  title: string;
  transcript: string;
  wordCount: number;
  durationSeconds: number | null;
  segments: TranscriptSegment[];
  suggestions: SpeechSuggestion[];
}): Promise<SpeechEntry> {
  const { entry } = await postFunction<{ entry: SpeechEntry }>(
    "speech-save",
    input,
  );
  return entry;
}

export async function getSpeechEntry(id: string): Promise<SpeechEntry> {
  const { entry } = await getFunction<{ entry: SpeechEntry }>("speech-get", id);
  return entry;
}
