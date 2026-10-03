import { getFunction, postFunction } from "../../lib/supabaseFunctions";
import { logTokenUsage, type TokenUsage } from "../wordSearch/usage";
import type {
  ChosenAlternatives,
  SpeechSuggestion,
  TranscriptSegment,
} from "./speechTypes";

export interface SpeechEntry {
  id: string;
  title: string;
  transcript: string;
  segments: TranscriptSegment[];
  suggestions: SpeechSuggestion[];
  chosenAlternatives: ChosenAlternatives;
  durationSeconds: number | null;
  wordCount: number;
  reviewedAt: string | null;
  createdAt: string;
}

export type SpeechEntrySummary = Omit<
  SpeechEntry,
  "transcript" | "segments" | "suggestions" | "chosenAlternatives"
>;

// TODO: use proper lib (swr/tanstack query) if there are more use cases for proper caching
// of fetched data
let cachedEntries: Promise<SpeechEntrySummary[]> | null = null;

async function fetchSpeechEntries(): Promise<SpeechEntrySummary[]> {
  const { entries } = await postFunction<{ entries: SpeechEntrySummary[] }>(
    "speech-list",
  );
  return entries;
}

export function listSpeechEntries(): Promise<SpeechEntrySummary[]> {
  if (cachedEntries !== null) {
    return cachedEntries;
  }

  const entries = fetchSpeechEntries();
  cachedEntries = entries;
  entries.catch(() => {
    if (cachedEntries === entries) {
      cachedEntries = null;
    }
  });
  return entries;
}

export function invalidateSpeechEntries(): void {
  cachedEntries = null;
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
  invalidateSpeechEntries();
  return entry;
}

export async function getSpeechEntry(id: string): Promise<SpeechEntry> {
  const { entry } = await getFunction<{ entry: SpeechEntry }>("speech-get", id);
  return entry;
}

export async function finishSpeechReview(input: {
  id: string;
  chosenAlternatives: ChosenAlternatives;
}): Promise<void> {
  await postFunction("speech-update", input);
  invalidateSpeechEntries();
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
