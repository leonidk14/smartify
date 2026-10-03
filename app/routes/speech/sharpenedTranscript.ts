import type {
  ChosenAlternatives,
  SpeechSuggestion,
  TranscriptSegment,
} from "./speechTypes";

export type TranscriptSpan =
  | { type: "plain"; text: string }
  | { type: "suggested" | "swapped"; text: string; suggestionId: string };

export interface KeepRow {
  suggestionId: string;
  phrase: string;
  replaced: string;
  vocabularyWord: string;
}

export interface SharpenedTranscript {
  spans: TranscriptSpan[];
  keepRows: KeepRow[];
}

export function sharpenTranscript({
  segments,
  suggestions,
  chosenAlternatives,
}: {
  segments: TranscriptSegment[];
  suggestions: SpeechSuggestion[];
  chosenAlternatives: ChosenAlternatives;
}): SharpenedTranscript {
  const spans: TranscriptSpan[] = [];
  const keepRows: KeepRow[] = [];

  for (const segment of segments) {
    const suggestion =
      segment.suggestionId === null
        ? undefined
        : suggestions.find(({ id }) => id === segment.suggestionId);
    if (suggestion === undefined) {
      spans.push({ type: "plain", text: segment.text });
      continue;
    }

    const chosenIndex = chosenAlternatives[suggestion.id];
    const chosen =
      chosenIndex === undefined
        ? undefined
        : suggestion.alternatives[chosenIndex];
    if (chosen === undefined) {
      spans.push({
        type: "suggested",
        text: segment.text,
        suggestionId: suggestion.id,
      });
      continue;
    }

    spans.push({
      type: "swapped",
      text: chosen.phrase,
      suggestionId: suggestion.id,
    });
    keepRows.push({
      suggestionId: suggestion.id,
      phrase: chosen.phrase,
      replaced: segment.text,
      vocabularyWord: chosen.vocabularyWord,
    });
  }

  return { spans, keepRows };
}
