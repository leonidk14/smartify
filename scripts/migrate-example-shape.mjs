// One-time (re-runnable) migration of every meaning's `example` from the old
// fused string — "'quote' — Author, Title" — to the structured shape
// { original, source, generated }.
//
// Migrates all three copies of the data, each from its own contents:
// 1. data/vocabulary.json, rewritten in place (skipped when absent).
// 2. The `vocabulary` table — the source of truth, which may hold words the
//    local seed file does not.
// 3. seeds/vocabulary.json in Storage, re-uploaded from the migrated local file
//    (skipped when step 1 was skipped).
//
// Usage: node --env-file=.env scripts/migrate-example-shape.mjs [--dry-run]
// --dry-run reports every example it would rewrite and writes nothing.
// Already-migrated examples are left untouched, so re-running is safe.
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

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

// The quote body is greedy so it backtracks to the last "'" that precedes the
// em dash — apostrophes inside the quote ("the knife's edge") and inside the
// attribution ("Patrick O'Brian") both survive.
const EXAMPLE_PATTERN = /^\s*'(.*)'\s*—\s*(.*?)\s*$/s;

function toExampleSentence(example) {
  const match = EXAMPLE_PATTERN.exec(example);
  if (!match) {
    return {
      example: {
        original: example.trim().replace(/^'|'$/g, ""),
        source: "",
        generated: false,
      },
      isParsed: false,
    };
  }
  return {
    example: { original: match[1], source: match[2], generated: false },
    isParsed: true,
  };
}

function withMigratedExamples({ groups, word }) {
  const changes = [];

  const migrated = groups.map((group) => ({
    ...group,
    meanings: Object.fromEntries(
      Object.entries(group.meanings ?? {}).map(([id, meaning]) => {
        if (typeof meaning.example !== "string") {
          return [id, meaning];
        }
        const { example, isParsed } = toExampleSentence(meaning.example);
        changes.push({ word, before: meaning.example, after: example, isParsed });
        return [id, { ...meaning, example }];
      }),
    ),
  }));

  return { groups: migrated, changes };
}

function report({ target, changes }) {
  const unparsed = changes.filter((change) => !change.isParsed);
  console.log(
    isDryRun
      ? `${target}: would rewrite ${changes.length} example(s).`
      : `${target}: rewrote ${changes.length} example(s).`,
  );

  if (isDryRun) {
    for (const { word, after } of changes) {
      console.log(`  ${word}`);
      console.log(`    original: ${after.original}`);
      console.log(`    source:   ${after.source}`);
    }
  }

  if (unparsed.length) {
    console.log(
      `  ${unparsed.length} did not match the expected format and were kept whole in "original" — review by hand:`,
    );
    for (const { word, before } of unparsed) {
      console.log(`    ${word}: ${before}`);
    }
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
      const result = withMigratedExamples({ groups: entry.groups ?? [], word });
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
    const result = withMigratedExamples({
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
