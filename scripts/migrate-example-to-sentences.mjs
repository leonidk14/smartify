// One-time (re-runnable) migration folding every meaning's `example` into the
// practice cache: the example becomes the first entry of `sentences` (with
// `simplified` left null for generate-sentence to backfill) and the `example`
// property is dropped. A meaning that already holds the maximum of three
// sentences loses its last one, so the cache size never grows.
//
// Migrates all three copies of the data, each from its own contents:
// 1. data/vocabulary.json, rewritten in place (skipped when absent).
// 2. The `vocabulary` table — the source of truth, which may hold words the
//    local seed file does not.
// 3. seeds/vocabulary.json in Storage, re-uploaded from the migrated local file
//    (skipped when step 1 was skipped).
//
// Usage: node --env-file=.env scripts/migrate-example-to-sentences.mjs [--dry-run]
// --dry-run reports every meaning it would rewrite and writes nothing.
// Meanings without an `example` are left untouched, so re-running is safe.
// Requires SUPABASE_SERVICE_ROLE_KEY (Project Settings → API) and
// SUPABASE_URL (or VITE_SUPABASE_URL).
import { readFile, writeFile } from "node:fs/promises";

const isDryRun = process.argv.includes("--dry-run");

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const SEED_PATH = "data/vocabulary.json";
const STORAGE_OBJECT = "storage/v1/object/seeds/vocabulary.json";

// Mirrors SENTENCES_IN_CACHE_SIZE in supabase/functions/generate-sentence.
const MAX_SENTENCES = 3;

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

function withExampleAsFirstSentence(meaning) {
  const { example, ...rest } = meaning;
  const existing = rest.sentences ?? [];
  const kept = existing.slice(0, MAX_SENTENCES - 1);

  return {
    meaning: {
      ...rest,
      sentences: [
        {
          sentence: {
            original: example.original,
            source: example.source,
            simplified: null,
          },
          usageCount: 0,
        },
        ...kept,
      ],
    },
    dropped: existing.slice(MAX_SENTENCES - 1),
  };
}

function withMigratedMeanings({ groups, word }) {
  const changes = [];

  const migrated = groups.map((group) => ({
    ...group,
    meanings: Object.fromEntries(
      Object.entries(group.meanings ?? {}).map(([id, meaning]) => {
        if (!meaning.example) {
          return [id, meaning];
        }
        const { meaning: updated, dropped } =
          withExampleAsFirstSentence(meaning);
        changes.push({ word, example: meaning.example, dropped });
        return [id, updated];
      }),
    ),
  }));

  return { groups: migrated, changes };
}

function report({ target, changes }) {
  const dropped = changes.flatMap((change) =>
    change.dropped.map((entry) => ({ word: change.word, entry })),
  );

  console.log(
    isDryRun
      ? `${target}: would rewrite ${changes.length} meaning(s), dropping ${dropped.length} sentence(s).`
      : `${target}: rewrote ${changes.length} meaning(s), dropped ${dropped.length} sentence(s).`,
  );

  if (isDryRun) {
    for (const { word, example } of changes) {
      console.log(`  ${word}`);
      console.log(`    original: ${example.original}`);
      console.log(`    source:   ${example.source}`);
    }
  }

  for (const { word, entry } of dropped) {
    console.log(
      `  dropped from ${word} (usageCount ${entry.usageCount}): ${entry.sentence.original}`,
    );
  }
}

async function migrateSeedFile() {
  let json;
  try {
    json = await readFile(SEED_PATH, "utf8");
  } catch {
    console.log(`${SEED_PATH} not found locally, skipping the seed file.`);
    return null;
  }

  const store = JSON.parse(json);
  const changes = [];
  const migrated = Object.fromEntries(
    Object.entries(store).map(([word, entry]) => {
      const result = withMigratedMeanings({ groups: entry.groups ?? [], word });
      changes.push(...result.changes);
      return [word, { ...entry, groups: result.groups }];
    }),
  );

  report({ target: SEED_PATH, changes });

  const serialized = JSON.stringify(migrated, null, 2);
  if (!isDryRun) {
    await writeFile(SEED_PATH, serialized);
  }
  return serialized;
}

async function migrateTable() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/vocabulary?select=*`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`Table read failed: ${await response.text()}`);
  }

  const rows = await response.json();
  const changes = [];
  const migrated = rows.map((row) => {
    const result = withMigratedMeanings({
      groups: row.groups ?? [],
      word: row.word,
    });
    changes.push(...result.changes);
    return { ...row, groups: result.groups };
  });

  report({ target: `vocabulary table (${rows.length} rows)`, changes });

  if (isDryRun || changes.length === 0) {
    return;
  }

  const upsert = await fetch(`${SUPABASE_URL}/rest/v1/vocabulary`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(migrated),
  });
  if (!upsert.ok) {
    throw new Error(`Table upsert failed: ${await upsert.text()}`);
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
  console.log("Uploaded migrated seed to Storage: seeds/vocabulary.json");
}

if (isDryRun) {
  console.log("Dry run — nothing will be written.\n");
}

const migratedSeed = await migrateSeedFile();
await migrateTable();

if (migratedSeed && !isDryRun) {
  await uploadSeedToStorage(migratedSeed);
}
