export interface SuggestionAlternative {
  phrase: string;
  register: string;
  inSentence: string;
  vocabularyWord: string;
}

export interface SpeechSuggestion {
  id: string;
  original: string;
  alternatives: SuggestionAlternative[];
}

export interface TranscriptSegment {
  text: string;
  suggestionId: string | null;
}

export type ChosenAlternatives = Record<string, number>;
