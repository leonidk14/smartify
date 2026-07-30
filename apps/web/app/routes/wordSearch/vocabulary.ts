import axios from "axios";
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
  } catch (error) {
    // A response means the server was reached and refused — an error page is honest,
    // where the snapshot below would render a silently empty vocabulary instead.
    if (axios.isAxiosError(error) && error.response !== undefined) {
      throw error;
    }
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

export async function setPracticeLater({
  word,
  shouldPracticeLater,
}: {
  word: string;
  shouldPracticeLater: boolean;
}): Promise<void> {
  await postFunction("vocabulary-mark-practice", {
    word: word.trim().toLowerCase(),
    shouldPracticeLater,
  });
}

export async function downloadForOffline(): Promise<void> {
  const { store } = await postFunction<{ store: VocabularyStore }>(
    "vocabulary-list",
  );
  await saveSnapshot(store);
}
