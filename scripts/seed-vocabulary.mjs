// One-time (re-runnable) vocabulary seeding.
//
// 1. Uploads data/vocabulary.json to the private `seeds` Storage bucket so a
//    cloud copy of the seed always exists as a fallback/restore source.
// 2. Upserts every entry into the `vocabulary` table. If the local file is
//    missing, the Storage copy is downloaded and used instead.
//
// Usage: node --env-file=.env scripts/seed-vocabulary.mjs [--from-storage] [--dry-run]
// --from-storage skips the local file and re-seeds the table from the copy in
// the `seeds` bucket (restore path); the Storage copy is left untouched.
// --dry-run prints what would be written and exits without touching Storage or
// the table — worth running first, the local seed file can lag behind the table.
// Requires SUPABASE_SERVICE_ROLE_KEY (Project Settings → API) and
// SUPABASE_URL (or VITE_SUPABASE_URL). Every row needs an owner, resolved from
// SEED_OWNER_EMAIL (default below) — the account must already exist.
import { readFile } from "node:fs/promises";

const isFromStorage = process.argv.includes("--from-storage");
const isDryRun = process.argv.includes("--dry-run");

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "leonid.kaida@outlook.com";

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

async function resolveOwnerId() {
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
    { headers },
  );
  if (!response.ok) {
    throw new Error(`Could not list auth users: ${await response.text()}`);
  }
  const { users } = await response.json();
  const owner = (users ?? []).find((user) => user.email === OWNER_EMAIL);
  if (!owner) {
    throw new Error(
      `No account for ${OWNER_EMAIL}. Create it in Authentication → Users, or set SEED_OWNER_EMAIL.`,
    );
  }
  return owner.id;
}

function buildRows({ store, ownerId }) {
  return Object.entries(store).map(([word, entry]) => {
    const key = word.trim().toLowerCase();
    return {
      user_id: ownerId,
      word: key,
      // Prefer an explicit display (multi-word / real-hyphen entries); else the
      // key itself, which for the single-word seeds is already the readable form.
      display: entry.display ?? key,
      groups: entry.groups,
      should_practice_later: entry.shouldPracticeLater,
      saved_at: entry.savedAt,
      // The service role bypasses the column grant that keeps is_public immutable
      // to clients, so seeding is the one place the flag can be set.
      is_public: entry.isPublic ?? false,
    };
  });
}

async function upsertRows(rows) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/vocabulary?on_conflict=user_id,word`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(rows),
    },
  );
  if (!response.ok) {
    throw new Error(`Table upsert failed: ${await response.text()}`);
  }
  console.log(`Upserted ${rows.length} words into vocabulary.`);
}

const json = await loadSeed();
const ownerId = await resolveOwnerId();
const rows = buildRows({ store: JSON.parse(json), ownerId });
const publicWords = rows.filter((row) => row.is_public).map((row) => row.word);

if (isDryRun) {
  console.log(`Dry run — nothing written.`);
  console.log(`  owner:  ${OWNER_EMAIL} (${ownerId})`);
  console.log(`  words:  ${rows.length}`);
  console.log(`  public: ${publicWords.length} [${publicWords.join(", ")}]`);
  console.log(`  first:  ${rows.slice(0, 5).map((row) => row.word).join(", ")}`);
  console.log(
    isFromStorage
      ? "  source: the Storage copy"
      : `  source: ${SEED_PATH} (would also be uploaded to Storage)`,
  );
  process.exit(0);
}

if (!isFromStorage) {
  await uploadSeedToStorage(json);
}
await upsertRows(rows);
