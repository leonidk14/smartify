// Rules shared by the typed counter, the check screen (#05), save, and the list
// (#04) — one definition of "how big is this transcript" wherever it's counted.

import { MAX_TRANSCRIPT_CHARACTERS } from "./speechConstants";

const TITLE_WORD_COUNT = 6;

export function countCharacters(text: string): number {
  return text.length;
}

export function isSubmittableTranscript(text: string): boolean {
  return (
    text.trim() !== "" && countCharacters(text) <= MAX_TRANSCRIPT_CHARACTERS
  );
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

export function deriveTitle(transcript: string): string {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const title = words.slice(0, TITLE_WORD_COUNT).join(" ");
  return words.length > TITLE_WORD_COUNT ? `${title}…` : title;
}
