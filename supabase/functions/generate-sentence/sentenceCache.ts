import type { TokenUsage } from "../_shared/usage.ts";

// Mirrors the client-side shape in app/routes/wordSearch/vocabulary.ts and
// app/routes/practice/sentenceTypes.ts. Kept local rather than tightening
// `groups: unknown[]` in _shared/vocabularyRows.ts, which the other
// vocabulary-* functions rely on treating as opaque.

export interface GeneratedSentence {
  original: string;
  source: string;
  /** Null on a sentence seeded from a dictionary example, until backfilled. */
  simplified: string | null;
  rephraseTarget?: string | null;
  meaning?: string;
  generated?: boolean;
  error?: string;
}

export interface SentenceGeneration {
  sentence: GeneratedSentence;
  usage: TokenUsage;
}

export interface CachedSentence {
  sentence: GeneratedSentence;
  usageCount: number;
}

export interface StoredMeaning {
  definition: string;
  order: number;
  sentences?: CachedSentence[];
}

export interface StoredMeaningGroup {
  part_of_speech: string;
  meanings: Record<string, StoredMeaning>;
}

export const SENTENCES_IN_CACHE_SIZE = 3;

function findMeaning({
  groups,
  meaningId,
}: {
  groups: StoredMeaningGroup[];
  meaningId: string;
}): StoredMeaning | undefined {
  for (const group of groups) {
    const meaning = group.meanings?.[meaningId];
    if (meaning) {
      return meaning;
    }
  }
  return undefined;
}

// `undefined` means the word or meaning is not in the store, so there is
// nowhere to cache a sentence for it.
export function getSentences({
  groups,
  meaningId,
}: {
  groups: StoredMeaningGroup[];
  meaningId: string;
}): CachedSentence[] | undefined {
  const meaning = findMeaning({ groups, meaningId });
  if (!meaning) {
    return undefined;
  }
  return meaning.sentences ?? [];
}

export function leastUsedIndex(sentences: CachedSentence[]): number {
  let index = 0;
  for (let i = 1; i < sentences.length; i += 1) {
    if (sentences[i].usageCount < sentences[index].usageCount) {
      index = i;
    }
  }
  return index;
}

// The two updates below leave `groups` untouched and return a changed copy of
// it, which the caller saves.

export function addSentence({
  groups,
  meaningId,
  sentence,
}: {
  groups: StoredMeaningGroup[];
  meaningId: string;
  sentence: GeneratedSentence;
}): StoredMeaningGroup[] {
  const updated = structuredClone(groups);
  const meaning = findMeaning({ groups: updated, meaningId });
  if (!meaning) {
    throw new Error(`No meaning "${meaningId}" to add a sentence to`);
  }
  meaning.sentences = [
    ...(meaning.sentences ?? []),
    { sentence, usageCount: 1 },
  ];
  return updated;
}

export function incrementUsageCount({
  groups,
  meaningId,
  sentenceIndex,
}: {
  groups: StoredMeaningGroup[];
  meaningId: string;
  sentenceIndex: number;
}): StoredMeaningGroup[] {
  const updated = structuredClone(groups);
  const meaning = findMeaning({ groups: updated, meaningId });
  const target = meaning?.sentences?.[sentenceIndex];
  if (!target) {
    throw new Error(
      `No sentence at index ${sentenceIndex} for meaning "${meaningId}"`,
    );
  }
  target.usageCount += 1;
  return updated;
}

export function setSimplified({
  groups,
  meaningId,
  sentenceIndex,
  simplified,
  rephraseTarget,
}: {
  groups: StoredMeaningGroup[];
  meaningId: string;
  sentenceIndex: number;
  simplified: string;
  rephraseTarget: string;
}): StoredMeaningGroup[] {
  const updated = structuredClone(groups);
  const meaning = findMeaning({ groups: updated, meaningId });
  const target = meaning?.sentences?.[sentenceIndex];
  if (!target) {
    throw new Error(
      `No sentence at index ${sentenceIndex} for meaning "${meaningId}"`,
    );
  }
  target.sentence.simplified = simplified;
  target.sentence.rephraseTarget = rephraseTarget;
  return updated;
}
