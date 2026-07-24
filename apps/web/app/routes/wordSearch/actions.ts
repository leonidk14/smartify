import { getFunction } from "../../lib/supabaseFunctions";
import type { TokenUsage } from "./usage";

export type { TokenUsage } from "./usage";

export interface ExampleSentence {
  original: string;
  source: string;
  /** The prompt requires a real quotation, so this should always be false. */
  generated: boolean;
}

export interface Meaning {
  definition: string;
  example: ExampleSentence;
}

export interface MeaningGroup {
  part_of_speech: string;
  meanings: Meaning[];
}

export interface Typo {
  input: string;
  suggestion: string;
}

export interface DictionaryResult {
  groups: MeaningGroup[];
  typo?: Typo;
}

export type LookupResult = {
  dictionary: DictionaryResult;
  usage: TokenUsage;
  originalSearchItem?: string;
  shouldPracticeLater?: boolean;
};

function toLookupSlug(word: string): string {
  return word.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function lookupWord(word: string): Promise<LookupResult> {
  return getFunction<LookupResult>("lookup", toLookupSlug(word));
}
