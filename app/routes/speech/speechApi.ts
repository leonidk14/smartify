import { getFunction, postFunction } from "../../lib/supabaseFunctions";
import { logTokenUsage, type TokenUsage } from "../wordSearch/usage";
import type { SpeechSuggestion, TranscriptSegment } from "./speechTypes";

export interface SpeechEntry {
  id: string;
  title: string;
  transcript: string;
  segments: TranscriptSegment[];
  suggestions: SpeechSuggestion[];
  chosenAlternatives: unknown;
  durationSeconds: number | null;
  wordCount: number;
  reviewedAt: string | null;
  createdAt: string;
}

export function isSpeechEntry(value: unknown): value is SpeechEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "transcript" in value &&
    "createdAt" in value
  );
}

export type SpeechEntrySummary = Omit<
  SpeechEntry,
  "transcript" | "segments" | "suggestions" | "chosenAlternatives"
>;

export async function listSpeechEntries(): Promise<SpeechEntrySummary[]> {
  const { entries } = await postFunction<{ entries: SpeechEntrySummary[] }>(
    "speech-list",
  );
  return entries;
}

export async function saveSpeechEntry(
  input: {
    title: string;
    transcript: string;
    wordCount: number;
    durationSeconds: number | null;
    segments: TranscriptSegment[];
    suggestions: SpeechSuggestion[];
  },
  signal?: AbortSignal,
): Promise<SpeechEntry> {
  const { entry } = await postFunction<{ entry: SpeechEntry }>(
    "speech-save",
    input,
    {},
    signal,
  );
  return entry;
}

export async function getSpeechEntry(id: string): Promise<SpeechEntry> {
  const { entry } = await getFunction<{ entry: SpeechEntry }>("speech-get", id);
  return entry;
}

export interface SpeechAnalysis {
  segments: TranscriptSegment[];
  suggestions: SpeechSuggestion[];
}

export async function analyzeSpeech(
  transcript: string,
  signal?: AbortSignal,
): Promise<SpeechAnalysis> {
  const { segments, suggestions, usage, source } = await postFunction<
    SpeechAnalysis & { usage: TokenUsage; source: string }
  >("sharpen", { transcript }, {}, signal);

  logTokenUsage({ usage, label: `sharpen (${source})` });
  return { segments, suggestions };
}
