import { v4 as uuidv4 } from "uuid";
import { readSnapshot, saveSnapshot } from "../../lib/offlineCache";
import { postFunction } from "../../lib/supabaseFunctions";
import type { CachedSentence } from "../practice/sentenceTypes";
import type { MeaningGroup } from "./actions";

export interface StoredMeaning {
  definition: string;
  order: number;
  sentences?: CachedSentence[];
}

export interface StoredMeaningGroup {
  part_of_speech: string;
  meanings: Record<string, StoredMeaning>;
}

export interface VocabularyEntry {
  groups: StoredMeaningGroup[];
  display?: string;
  shouldPracticeLater: boolean;
  savedAt: string;
}

export type VocabularyStore = Record<string, VocabularyEntry>;

function toStoredGroups(groups: MeaningGroup[]): StoredMeaningGroup[] {
  return groups.map((group) => {
    const meanings: Record<string, StoredMeaning> = {};
    group.meanings.forEach(({ definition, example }, order) => {
      meanings[uuidv4()] = {
        definition,
        order,
        sentences: [
          {
            sentence: {
              original: example.original,
              source: example.source,
              simplified: null,
            },
            usageCount: 0,
          },
        ],
      };
    });
    return { part_of_speech: group.part_of_speech, meanings };
  });
}

export async function readVocabulary(): Promise<{
  store: VocabularyStore;
  isFromOfflineCopy: boolean;
}> {
  try {
    const { store } = await postFunction<{ store: VocabularyStore }>(
      "vocabulary-list",
    );
    return { store, isFromOfflineCopy: false };
  } catch {
    // Supabase unreachable (offline) — fall back to the downloaded snapshot.
    return { store: await readSnapshot(), isFromOfflineCopy: true };
  }
}

export async function saveWord({
  word,
  display,
  groups,
}: {
  word: string;
  display: string;
  groups: MeaningGroup[];
}): Promise<VocabularyEntry> {
  const { entry } = await postFunction<{ entry: VocabularyEntry }>(
    "vocabulary-save",
    {
      word: word.trim().toLowerCase(),
      display: display.trim().toLowerCase(),
      groups: toStoredGroups(groups),
    },
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
