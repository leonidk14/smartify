import Dexie, { type Table } from "dexie";
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

// One IndexedDB row per word. The word is the primary key; the rest of the row
// is a plain VocabularyEntry, so the store is easy to assemble back into the
// VocabularyStore Record the rest of the app expects.
interface VocabularyRow extends VocabularyEntry {
  word: string;
}

class VocabularyDatabase extends Dexie {
  words!: Table<VocabularyRow, string>;

  constructor() {
    super("dgw-vocabulary");
    this.version(1).stores({ words: "word" });
  }
}

const db = new VocabularyDatabase();

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
  const rows = await db.words.toArray();
  const store: VocabularyStore = {};
  for (const { word, ...entry } of rows) {
    store[word] = entry;
  }
  if (migrateStore(store)) {
    await writeVocabulary(store);
  }
  return store;
}

export async function writeVocabulary(store: VocabularyStore): Promise<void> {
  const rows: VocabularyRow[] = Object.entries(store).map(([word, entry]) => ({
    word,
    ...entry,
  }));
  await db.words.bulkPut(rows);
}

export async function saveWord({
  word,
  groups,
}: {
  word: string;
  groups: MeaningGroup[];
}): Promise<VocabularyEntry> {
  const entry: VocabularyEntry = {
    groups: toStoredGroups(groups),
    shouldPracticeLater: false,
    savedAt: new Date().toISOString(),
  };
  await db.words.put({ word: word.trim().toLowerCase(), ...entry });
  return entry;
}

export async function markForPractice(word: string): Promise<void> {
  const key = word.trim().toLowerCase();
  const row = await db.words.get(key);

  if (row) {
    row.shouldPracticeLater = true;
    await db.words.put(row);
  }
}
