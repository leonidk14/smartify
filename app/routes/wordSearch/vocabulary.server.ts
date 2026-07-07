import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { MeaningGroup } from "./actions";

export interface VocabularyEntry {
  groups: MeaningGroup[];
  shouldPracticeLater: boolean;
  savedAt: string;
}

export type VocabularyStore = Record<string, VocabularyEntry>;

const VOCABULARY_PATH = path.resolve(
  process.cwd(),
  "data",
  "vocabulary.json",
);

export async function readVocabulary(): Promise<VocabularyStore> {
  try {
    const raw = await fs.readFile(VOCABULARY_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeVocabulary(store: VocabularyStore): Promise<void> {
  await fs.mkdir(path.dirname(VOCABULARY_PATH), { recursive: true });
  await fs.writeFile(VOCABULARY_PATH, JSON.stringify(store, null, 2));
}

export async function saveWord(
  word: string,
  groups: MeaningGroup[],
): Promise<void> {
  const store = await readVocabulary();

  store[word.trim().toLowerCase()] = {
    groups,
    shouldPracticeLater: false,
    savedAt: new Date().toISOString(),
  };

  await writeVocabulary(store);
}

export async function markForPractice(word: string): Promise<void> {
  const store = await readVocabulary();
  const key = word.trim().toLowerCase();

  if (store[key]) {
    store[key].shouldPracticeLater = true;
    await writeVocabulary(store);
  }
}
