import Dexie, { type Table } from "dexie";
import type {
  VocabularyEntry,
  VocabularyStore,
} from "../routes/wordSearch/vocabulary";

interface VocabularyRow extends VocabularyEntry {
  word: string;
}

class VocabularyDatabase extends Dexie {
  words!: Table<VocabularyRow, string>;

  constructor() {
    super("smartify-vocabulary");
    this.version(1).stores({ words: "word" });
  }
}

const db = new VocabularyDatabase();

export async function saveSnapshot(store: VocabularyStore): Promise<void> {
  const rows: VocabularyRow[] = Object.entries(store).map(([word, entry]) => ({
    word,
    ...entry,
  }));
  await db.transaction("rw", db.words, async () => {
    await db.words.clear();
    await db.words.bulkPut(rows);
  });
}

export async function readSnapshot(): Promise<VocabularyStore> {
  const rows = await db.words.toArray();
  const store: VocabularyStore = {};
  for (const { word, ...entry } of rows) {
    store[word] = entry;
  }
  return store;
}

export async function hasSnapshot(): Promise<boolean> {
  return (await db.words.count()) > 0;
}

// The snapshot holds one user's words, so it has to go when they sign out —
// otherwise the next person to sign in on this device reads them offline.
export async function clearSnapshot(): Promise<void> {
  await db.words.clear();
}
