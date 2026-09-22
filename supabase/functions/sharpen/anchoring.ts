// Mirrors the shapes in app/routes/speech/speechTypes.ts (SuggestionAlternative,
// SpeechSuggestion, TranscriptSegment) — Deno functions can't import from app/,
// so they're duplicated here.

export interface RawAlternative {
  phrase: string;
  register: string;
  inSentence: string;
  vocabularyWord: string;
}

export interface RawSuggestion {
  original: string;
  occurrenceIndex: number;
  alternatives: RawAlternative[];
}

export interface AnchoredSuggestion {
  id: string;
  original: string;
  alternatives: RawAlternative[];
}

export interface TranscriptSegment {
  text: string;
  suggestionId: string | null;
}

export interface AnchoringResult {
  segments: TranscriptSegment[];
  suggestions: AnchoredSuggestion[];
  droppedCount: number;
}

const MAX_ALTERNATIVES = 3;
const MAX_SUGGESTIONS = 3;

interface Anchor {
  start: number;
  end: number;
  original: string;
  alternatives: RawAlternative[];
}

function findOccurrences(transcript: string, original: string): number[] {
  const starts: number[] = [];
  let fromIndex = 0;
  while (fromIndex <= transcript.length) {
    const index = transcript.indexOf(original, fromIndex);
    if (index === -1) {
      break;
    }
    starts.push(index);
    fromIndex = index + 1;
  }
  return starts;
}

function overlaps(
  a: { start: number; end: number },
  b: { start: number; end: number },
): boolean {
  return a.start < b.end && b.start < a.end;
}

export function anchorSuggestions({
  transcript,
  raw,
}: {
  transcript: string;
  raw: RawSuggestion[];
}): AnchoringResult {
  const anchors: Anchor[] = [];
  let droppedCount = 0;

  const drop = (suggestion: RawSuggestion, reason: string) => {
    droppedCount += 1;
    console.warn(`[sharpen] dropped "${suggestion.original}": ${reason}`);
  };

  for (const suggestion of raw) {
    if (anchors.length >= MAX_SUGGESTIONS) {
      drop(suggestion, "at most three suggestions survive");
      continue;
    }

    if (suggestion.alternatives.length === 0) {
      drop(suggestion, "no alternatives");
      continue;
    }

    if (suggestion.original.trim() === "") {
      drop(suggestion, "original is blank");
      continue;
    }

    const occurrences = findOccurrences(transcript, suggestion.original);
    if (occurrences.length === 0) {
      drop(suggestion, "original does not occur verbatim in the transcript");
      continue;
    }

    if (
      !Number.isInteger(suggestion.occurrenceIndex) ||
      suggestion.occurrenceIndex < 1 ||
      suggestion.occurrenceIndex > occurrences.length
    ) {
      drop(
        suggestion,
        `occurrence index ${suggestion.occurrenceIndex} is not between 1 and ${occurrences.length}`,
      );
      continue;
    }

    const start = occurrences[suggestion.occurrenceIndex - 1];
    const candidate = {
      start,
      end: start + suggestion.original.length,
      original: suggestion.original,
      alternatives: suggestion.alternatives.slice(0, MAX_ALTERNATIVES),
    };

    if (anchors.some((anchor) => overlaps(anchor, candidate))) {
      drop(suggestion, "overlaps a suggestion already anchored");
      continue;
    }

    anchors.push(candidate);
  }

  anchors.sort((a, b) => a.start - b.start);

  const segments: TranscriptSegment[] = [];
  const suggestions: AnchoredSuggestion[] = [];
  let cursor = 0;

  for (const [index, anchor] of anchors.entries()) {
    if (anchor.start > cursor) {
      segments.push({
        text: transcript.slice(cursor, anchor.start),
        suggestionId: null,
      });
    }

    const id = `s${index + 1}`;
    segments.push({
      text: transcript.slice(anchor.start, anchor.end),
      suggestionId: id,
    });
    suggestions.push({
      id,
      original: anchor.original,
      alternatives: anchor.alternatives,
    });
    cursor = anchor.end;
  }

  if (cursor < transcript.length) {
    segments.push({ text: transcript.slice(cursor), suggestionId: null });
  }

  return { segments, suggestions, droppedCount };
}
