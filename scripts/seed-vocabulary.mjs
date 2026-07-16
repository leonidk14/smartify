// One-time (re-runnable) vocabulary seeding.
//
// 1. Uploads data/vocabulary.json to the private `seeds` Storage bucket so a
//    cloud copy of the seed always exists as a fallback/restore source.
// 2. Upserts every entry into the `vocabulary` table. If the local file is
//    missing, the Storage copy is downloaded and used instead.
//
// Usage: node --env-file=.env scripts/seed-vocabulary.mjs [--from-storage]
// --from-storage skips the local file and re-seeds the table from the copy in
// the `seeds` bucket (restore path); the Storage copy is left untouched.
// Requires SUPABASE_SERVICE_ROLE_KEY (Project Settings → API) and
// SUPABASE_URL (or VITE_SUPABASE_URL).
import { readFile } from "node:fs/promises";

const isFromStorage = process.argv.includes("--from-storage");

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const SEED_PATH = "data/vocabulary.json";
const STORAGE_OBJECT = "storage/v1/object/seeds/vocabulary.json";

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

async function downloadSeedFromStorage() {
  const response = await fetch(`${SUPABASE_URL}/${STORAGE_OBJECT}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`No Storage copy of the seed (${response.status}).`);
  }
  return response.text();
}

async function loadSeed() {
  if (isFromStorage) {
    console.log("Seeding from the Storage copy (--from-storage)…");
    return downloadSeedFromStorage();
  }
  try {
    return await readFile(SEED_PATH, "utf8");
  } catch {
    console.log(`${SEED_PATH} not found locally, downloading Storage copy…`);
    return downloadSeedFromStorage();
  }
}

async function uploadSeedToStorage(json) {
  const response = await fetch(`${SUPABASE_URL}/${STORAGE_OBJECT}`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "x-upsert": "true",
    },
    body: json,
  });
  if (!response.ok) {
    throw new Error(`Storage upload failed: ${await response.text()}`);
  }
  console.log("Uploaded seed to Storage: seeds/vocabulary.json");
}

async function upsertRows(store) {
  const rows = Object.entries(store).map(([word, entry]) => ({
    word: word.trim().toLowerCase(),
    groups: entry.groups,
    should_practice_later: entry.shouldPracticeLater,
    saved_at: entry.savedAt,
  }));

  const response = await fetch(`${SUPABASE_URL}/rest/v1/vocabulary`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    throw new Error(`Table upsert failed: ${await response.text()}`);
  }
  console.log(`Upserted ${rows.length} words into vocabulary.`);
}

const json = await loadSeed();
if (!isFromStorage) {
  await uploadSeedToStorage(json);
}
await upsertRows(JSON.parse(json));
