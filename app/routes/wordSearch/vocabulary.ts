import { v4 as uuidv4 } from "uuid";
import { readSnapshot, saveSnapshot } from "../../lib/offlineCache";
import { postFunction } from "../../lib/supabaseFunctions";
import type { CachedSentence } from "../practice/sentenceTypes";
import type { MeaningGroup } from "./actions";

export interface StoredMeaning {
  definition: string;
  example: string;
  order: number;
  sentences?: CachedSentence[];
}

export interface StoredMeaningGroup {
  part_of_speech: string;
  meanings: Record<string, StoredMeaning>;
}

export interface VocabularyEntry {
  groups: StoredMeaningGroup[];
  shouldPracticeLater: boolean;
  savedAt: string;
}

export type VocabularyStore = Record<string, VocabularyEntry>;

function toStoredGroups(groups: MeaningGroup[]): StoredMeaningGroup[] {
  return groups.map((group) => {
    const meanings: Record<string, StoredMeaning> = {};
    group.meanings.forEach((meaning, order) => {
      meanings[uuidv4()] = { ...meaning, order };
    });
    return { part_of_speech: group.part_of_speech, meanings };
  });
}

function migrateStore(store: VocabularyStore): boolean {
  let changed = false;
  for (const entry of Object.values(store)) {
    if (!entry?.groups) {
      continue;
    }
    for (const group of entry.groups) {
      if (Array.isArray(group.meanings)) {
        const legacy = group.meanings as unknown as StoredMeaning[];
        const meanings: Record<string, StoredMeaning> = {};
        legacy.forEach((meaning, index) => {
          meanings[uuidv4()] = { ...meaning, order: meaning.order ?? index };
        });
        group.meanings = meanings;
        changed = true;
      }
    }
  }
  return changed;
}

export async function readVocabulary(): Promise<{
  store: VocabularyStore;
  isFromOfflineCopy: boolean;
}> {
  let store: VocabularyStore;
  try {
    ({ store } = await postFunction<{ store: VocabularyStore }>(
      "vocabulary-list",
    ));
  } catch {
    // Supabase unreachable (offline) — fall back to the downloaded snapshot.
    return { store: await readSnapshot(), isFromOfflineCopy: true };
  }
  if (migrateStore(store)) {
    await writeVocabulary(store);
  }
  return { store, isFromOfflineCopy: false };
}

export async function writeVocabulary(store: VocabularyStore): Promise<void> {
  await postFunction("vocabulary-bulk-put", { store });
}

export async function saveWord({
  word,
  groups,
}: {
  word: string;
  groups: MeaningGroup[];
}): Promise<VocabularyEntry> {
  const { entry } = await postFunction<{ entry: VocabularyEntry }>(
    "vocabulary-save",
    { word: word.trim().toLowerCase(), groups: toStoredGroups(groups) },
  );
  return entry;
}

export async function markForPractice(word: string): Promise<void> {
  await postFunction("vocabulary-mark-practice", {
    word: word.trim().toLowerCase(),
  });
}

export async function downloadForOffline(): Promise<void> {
  const { store } = await postFunction<{ store: VocabularyStore }>(
    "vocabulary-list",
  );
  await saveSnapshot(store);
}
