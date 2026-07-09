import * as fs from "node:fs/promises";
import * as path from "node:path";
import { v4 as uuidv4 } from "uuid";
import type { MeaningGroup } from "./actions";
import type { CachedSentence } from "../practice/sentenceTypes";

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

const VOCABULARY_PATH = path.resolve(process.cwd(), "data", "vocabulary.json");

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
    if (!entry?.groups) continue;
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

export async function readVocabulary(): Promise<VocabularyStore> {
  try {
    const raw = await fs.readFile(VOCABULARY_PATH, "utf-8");
    const store = JSON.parse(raw) as VocabularyStore;
    if (migrateStore(store)) {
      await writeVocabulary(store);
    }
    return store;
  } catch {
    return {};
  }
}

export async function writeVocabulary(store: VocabularyStore): Promise<void> {
  await fs.mkdir(path.dirname(VOCABULARY_PATH), { recursive: true });
  await fs.writeFile(VOCABULARY_PATH, JSON.stringify(store, null, 2));
}

export async function saveWord({
  word,
  groups,
}: {
  word: string;
  groups: MeaningGroup[];
}): Promise<VocabularyEntry> {
  const store = await readVocabulary();

  const entry: VocabularyEntry = {
    groups: toStoredGroups(groups),
    shouldPracticeLater: false,
    savedAt: new Date().toISOString(),
  };
  store[word.trim().toLowerCase()] = entry;

  await writeVocabulary(store);
  return entry;
}

export async function markForPractice(word: string): Promise<void> {
  const store = await readVocabulary();
  const key = word.trim().toLowerCase();

  if (store[key]) {
    store[key].shouldPracticeLater = true;
    await writeVocabulary(store);
  }
}
