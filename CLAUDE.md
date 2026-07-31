# Project conventions

## Working style (challenge my decisions)

Be a sparring partner, not an order-taker. Do not blindly execute instructions — pressure-test
them so decisions rest on facts and real needs rather than vibes or intuition.

- **Challenge with evidence.** When you doubt a request is the best idea or that it matches
  best practices, say so — and back it with something concrete (the code, docs, measured
  behavior, a named tradeoff), not just an opinion. "I think" isn't enough; show why.
- **Separate real requirements from assumptions.** Ask what problem is actually being solved
  before accepting an approach as given.
- **In planning, surface alternatives.** Lay out the other viable architectures/approaches and
  their tradeoffs, and if my proposal differs from how it would otherwise be done, call that
  out explicitly and explain the gap.
- **Then defer.** Challenge once, clearly; after I've heard the reasoning and decided, follow
  the decision without relitigating. The goal is a better decision, not the last word.

## Repository layout (npm workspaces)

Two independent apps under `apps/*`, with shared infra at the root.

| Path                                  | What                                                                                                                                                                                                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`                            | the PWA (React Router v7 SPA, Mantine). Workspace name `smartify`.                                                                                                                                                                                                                                          |
| `apps/landing`                        | the public marketing page. Plain HTML + CSS on Vite — **never add a framework or a runtime dependency to it**. The one exception is a ~15-line inline script in `index.html` driving the feature-card demo players; keep any further JS inline, vanilla, and this small. Workspace name `smartify-landing`. |
| `supabase/` `scripts/` `data/` `.env` | root-level, shared. Their commands run from the root unchanged.                                                                                                                                                                                                                                             |

The root `package.json` has **no dependencies** — it is workspace wiring plus script
aliases. Add dependencies to the owning app, never to the root. This holds for dev
tooling too: ESLint and Prettier are devDependencies of `apps/web`, and Prettier alone
of `apps/landing` (a devDependency is not the "runtime dependency" that app forbids).

```bash
npm run dev / build / serve / typecheck   # apps/web, on :5173
npm run landing:dev / landing:build       # apps/landing, on :5174
npm run verify                            # run after every change — see Verification
```

Only `.prettierrc.json` is shared from the root, since Prettier resolves config by
walking up from each file. The **`.prettierignore` files are per workspace and must
stay that way**: Prettier resolves ignore files relative to the CWD, so a root-level
one is invisible to `prettier --check .` running inside `apps/web`, and the generated
`.react-router/types/**` and `build/` trees would get reformatted.

`apps/web/vite.config.ts` sets `envDir: "../../"` so the app reads the root `.env` —
if `VITE_*` values ever come back undefined, check that first. The build's SW step
resolves as `node ../../scripts/generate-sw.mjs` from the `apps/web` CWD.

## Verification

**Run `npm run verify` after finishing any piece of work, and do not report the work
as done until it passes.** This is not conditional on the change looking small or
type-only — it is the definition of finished here. There is no CI and there are no git
hooks, so this command is the only thing standing between a mistake and `main`.

```bash
npm run verify     # typecheck -> eslint -> prettier -> deno, in that order
```

**`npm run verify` is the whole of what you run.** Anything that requires driving the
app — clicking through a flow, starting a dev server, installing the PWA, testing on a
phone, checking offline behaviour — **I run manually**. Do not launch the app or a
browser, and never report a behavioural claim as verified when it was only reasoned
about. Finish instead with the manual steps you want exercised and the expected result
of each, and say plainly which parts of the change stay unverified until I have done
them.

| Stage          | Command                | Fix with                         |
| -------------- | ---------------------- | -------------------------------- |
| Types          | `npm run typecheck`    | by hand                          |
| Lint           | `npm run lint`         | `npm run lint:fix`, then by hand |
| Format         | `npm run format:check` | `npm run format`                 |
| Edge functions | `npm run deno:check`   | `npm run deno:fmt`               |

Ownership is split by runtime, and the split is deliberate:

- **`apps/web`** — ESLint (flat config in `apps/web/eslint.config.js`) plus Prettier.
  Linting is **type-aware** (`projectService`), so `npm run lint` chains
  `react-router typegen` first; without the generated `./+types/*` modules the type
  information is missing and the run is meaningless.
- **`apps/landing`** — Prettier only. There is no JS to lint; the inline `<script>`
  in `index.html` gets formatted but not linted.
- **`supabase/functions`** — Deno owns both formatting and linting (`deno fmt`,
  `deno lint`). Node-based ESLint cannot resolve its `npm:` specifiers or `Deno`
  globals, so **do not** add these files to the ESLint or Prettier scope.
- **`scripts/*.mjs` and root Markdown/JSON are checked by nothing.** Known gap, not an
  oversight — the tooling is per workspace and those files are outside every workspace.

**Errors gate; warnings do not.** `npm run lint` deliberately does not pass
`--max-warnings`, so warnings are a real advisory tier — a rule sits at `warn` when it
is worth surfacing but not worth blocking on (`no-console`,
`react-hooks/set-state-in-effect`, most of the `@eslint-react` set). The exception is
the `@eslint-react/web-api-no-leaked-*` family, held at `error` on purpose: an effect
that registers a listener, timer, or observer without tearing it down leaks for the
whole session in a PWA, and that is not a judgement call.

That makes a passing run weaker than it looks, so **read the warnings before calling
work done** rather than trusting the exit code alone. If a warning is genuinely
acceptable, the fix is to say so — either move the rule to `off` in the config with a
reason, or suppress that one site — not to leave it accumulating. The one thing that
does still fail is a suppression whose finding no longer exists
(`reportUnusedDisableDirectives: "error"`), so stale `eslint-disable` comments cannot
rot quietly.

### Suppressions

A finding means the code is wrong. Fix the code.

`eslint-disable` at the call site is banned — there is no approved form of it. Not a
single-rule disable, not one with a comment explaining itself, not "just this once". If
a rule fires, the answer is a change to the code that makes it stop firing honestly.

Editing a rule in `eslint.config.js` is a different act and is allowed for exactly one
reason: **the rule is wrong about what the code means here** — it reports another rule's
finding under a second name, or it reasons from a type or an assumption that
misdescribes this project's runtime. It is never allowed because a finding is
inconvenient or expensive to fix. Every such entry carries a comment saying which case
it is: the `@eslint-react` block is the duplicate-finding kind, `only-throw-error`'s
`Response` allowance the wrong-about-the-framework kind.

Two `eslint-disable` sites predate this rule and **have been reviewed and accepted as
they stand**: the mount-only effects in
`apps/web/app/routes/wordSearch/lookupPanel.tsx` (`react-hooks/exhaustive-deps`) and the
storage-API guard in `apps/web/app/entry.client.tsx`
(`@typescript-eslint/no-unnecessary-condition`), where the DOM lib types an optional API
as always present. They are grandfathered, not a precedent — do not add a third.

## Styling (Mantine)

Prefer Mantine component **style props** over inline `style={{}}` objects. Reach for
`style` only for CSS properties that have no Mantine prop.

- Use props for spacing, sizing, color, layout, position, typography, borders:
  `p`/`px`/`py`/`m`/`mt`…, `w`/`h`/`miw`/`maw`, `bg`/`c`, `fz`/`fw`/`lh`/`ta`/`tt`,
  `pos`/`top`/`bottom`/`left`/`right`/`inset`, `flex`, `bd` (border), `bdrs`
  (border-radius). A full `border` shorthand + rounded corners is `bd="1px solid …"`
  `bdrs={14}`, not an inline `style`.
- Use the purpose-built components instead of hand-rolling flexbox: `Center` /
  `Group` / `Stack` / `Flex` for layout, `ThemeIcon` for an icon in a
  colored/bordered square or circle (its `size`/`radius`/`variant`/`color` props
  cover background, border, and centering).
- Keep in inline `style` only what Mantine has no prop for — e.g. single-side borders
  (`borderBottom` / `borderTop`), `cursor`, `userSelect`.
- Non-Mantine elements (e.g. Tabler `@tabler/icons-react` SVGs) take their own
  props (`size`, `color`) and `style`; Mantine style props don't apply to them.

Reference examples: [apps/web/app/routes/practice/practiceStart.tsx](apps/web/app/routes/practice/practiceStart.tsx),
[apps/web/app/routes/practice/practiceSelect.tsx](apps/web/app/routes/practice/practiceSelect.tsx).

## Code style

Formatting is Prettier's job — do not hand-format, just run `npm run format`. The one
non-default setting is `bracketSameLine: true` (a multi-line JSX opening tag closes its
`>` on the last attribute), which is how this codebase was already written.

Two rules below are now enforced by ESLint rather than by review — **always brace `if`
bodies** (`curly`) and **always `===` / `!==`** (`eqeqeq`, configured to reject
`x == null` as well). The rest are still yours to uphold; `react-hooks/refs` covers only
part of the ref rule.

- **Comments only in exceptional cases.** Code should be self-explanatory. Write a
  comment only to: leave a `TODO`, explain a rare/non-obvious edge case, explain
  genuinely complex logic, or mark something as intentionally descoped. Otherwise
  favor clear naming over narration — no comments.
- **Boolean names start with `is` / `should` / `has` / `can`.** e.g. `isShown` (not
  `show`), `hasError`, `shouldFocus`, `canSubmit`. Applies to booleans we author
  (variables, state, derived values); does not force renaming third-party props such
  as Mantine's `disabled` / `checked` / `opened`.
- **Derive, don't duplicate state.** Use the fewest states needed per entity — don't
  store what can be computed from existing state/props (e.g. the past `value` +
  `submitted` pair for one input should be a single state). Distinct entities
  (different inputs/objects) legitimately keep their own state.
- **Don't store values in refs.** `useRef` for DOM nodes / imperative handles is
  fine; using a ref as a mutable value store to avoid re-renders is not (rare edge
  cases only).
- **Always brace `if` bodies.** Even a single-line guard clause with a pure return
  gets curly braces — write `if (a) { return null; }`, never `if (a) return null;`.
  Applies equally to `continue` / `break` / `throw` guard clauses.
- **Always `===` / `!==`, never `==` / `!=`.** No exceptions — not even the
  `x != null` idiom for "null or undefined". Say what you mean:
  `x !== null && x !== undefined`, or restructure so the distinction isn't needed.
- **Explicit beats clever — don't make changes land via shared references.** Never
  mutate a nested node and rely on that silently updating a root object you save
  elsewhere (`chosen.usageCount += 1` … later … `save(tree)`). The reader has to
  chase aliases across functions to see that they are the same object. Instead have
  helpers take what they read and _return_ what they changed, so the data flow is
  visible at the call site:
  `await save(withUsageCountIncremented({ tree, index }))`. Simplicity over
  smartness — if following a value requires tracing references, restructure it.

## Vocabulary data & seeding

Vocabulary lives in the Supabase Postgres table `vocabulary`, **one row per word
per user**: primary key `(user_id, word)`, plus `groups` jsonb,
`should_practice_later`, `saved_at`, `display`, `is_public`. The SPA reaches it
through the `vocabulary-*` edge functions
(`supabase/functions/vocabulary-{list,save,mark-practice}`). IndexedDB
(`smartify-vocabulary`, via [apps/web/app/lib/offlineCache.ts](apps/web/app/lib/offlineCache.ts))
is only an on-demand offline snapshot, not a source of truth.

**Visibility is enforced by RLS, not by JavaScript.** The policies in
`20260730120000_vocabulary_ownership.sql` say `is_public or user_id = auth.uid()`,
so the vocabulary functions use `createUserClient(req)` (the caller's JWT
forwarded to Postgres) rather than `createAdminClient()`, and carry no `.eq()`
filter of their own. Two consequences:

- The table is also readable straight over PostgREST with the published anon key —
  which returns exactly what `vocabulary-list` returns, since the same policies
  apply. Do not "fix" this by re-adding JS filters; add policies instead.
- `is_public` is withheld from the `authenticated` update grant, so only a
  migration or the service role can publish a word. `user_id` **is** in that
  grant, because PostgREST compiles upserts into `on conflict do update set
<every column sent>` — the update policy is what pins it to `auth.uid()`.
- **That UPDATE grant is column-scoped** (the explicit list in
  `20260730120000_vocabulary_ownership.sql`). So **any new client-writable column
  on `vocabulary` needs its own `grant update (<col>) on public.vocabulary to
authenticated;` in a migration** — otherwise, because Postgres checks column
  privileges when it _plans_ the upsert's `on conflict do update set`, **every**
  save fails with `42501 permission denied` (not just conflicting ones). INSERT is
  table-wide, so only UPDATE needs the per-column grant. Withhold the grant only
  when the column is meant to be immutable to clients, as `is_public` is.

A write must never land on a public row the caller does not own. Route every such
write through `ensureOwnedWord` in
[supabase/functions/_shared/vocabularyAccess.ts](supabase/functions/_shared/vocabularyAccess.ts),
which forks a private copy on first write; `preferOwnRows` from the same module is
how a fork shadows the public original wherever rows are read.

`vocabulary-list` is still callable anonymously — the policy, not the function,
decides that an anonymous caller sees only the public words. Every **write**
function calls `getRequestUser` and 401s anonymous callers; any new function that
mutates the database must do the same, since the anon key is published in the
client bundle and is not a credential.

`send-reminders` is the exception to all of this: it runs from cron with no user
JWT, so it stays on `createAdminClient()` and spells the visibility rule out
explicitly, per subscriber.

Seed data:

- **Local seed file:** [data/vocabulary.json](data/vocabulary.json) — a full
  `VocabularyStore` snapshot (`{ [word]: { groups, shouldPracticeLater, savedAt } }`,
  see [apps/web/app/routes/wordSearch/vocabulary.ts](apps/web/app/routes/wordSearch/vocabulary.ts)
  for the types), plus an optional `isPublic: true` per entry that the seed script
  maps onto the `is_public` column.
- **Cloud fallback copy:** the same file is stored in the private Supabase
  Storage bucket `seeds` as `seeds/vocabulary.json` (bucket created by the
  vocabulary migration).

To seed (or re-seed; upserts are idempotent):

```bash
# print what would be written and exit — the local file can lag behind the table
node --env-file=.env scripts/seed-vocabulary.mjs --dry-run

# uploads data/vocabulary.json to the seeds bucket AND upserts all words
node --env-file=.env scripts/seed-vocabulary.mjs

# restore the table from the Storage copy instead of the local file
node --env-file=.env scripts/seed-vocabulary.mjs --from-storage
```

Requires in `.env`: `SUPABASE_URL` (or `VITE_SUPABASE_URL`) and
`SUPABASE_SERVICE_ROLE_KEY` (server secret — bypasses RLS, never expose via a
`VITE_` var). Every row needs an owner, resolved by email from `SEED_OWNER_EMAIL`
(defaults to `leonid.kaida@outlook.com`); that account must already exist, since
`enable_signup = false` means users are created by hand in the dashboard. The
migrations must be applied first (`supabase db push`), since the script needs the
table and the `seeds` bucket to exist.

## Edge functions (Deno)

Edge functions run in Deno and declare npm deps inline with `npm:pkg@ver`
specifiers (e.g. `npm:@anthropic-ai/sdk@0.110.0`). After **adding or bumping**
an `npm:` import in any `supabase/functions/**` file, cache the package and
record it in the function lockfile — otherwise the Deno LSP flags
`npm package "…" is not installed or doesn't exist` and it stays out of
`supabase/functions/deno.lock`:

```bash
deno cache --config supabase/functions/deno.json supabase/functions/<name>/index.ts
```

(`--config` points Deno at `supabase/functions/deno.json` so it writes the
adjacent `supabase/functions/deno.lock`.) Commit the updated lockfile.

### LLM mode toggles (mock vs. real)

Every function that calls Anthropic is gated behind its own `*_MODE` secret,
checked as `Deno.env.get("<NAME>_MODE") !== "real"` → return mock. Unset or any
other value means mock, so the default never spends tokens:

| Function            | Secret          | Mock data                                      |
| ------------------- | --------------- | ---------------------------------------------- |
| `lookup`            | `LOOKUP_MODE`   | `supabase/functions/lookup/mock.ts`            |
| `generate-sentence` | `GENERATE_MODE` | `supabase/functions/generate-sentence/mock.ts` |
| `evaluate-sentence` | `EVALUATE_MODE` | `supabase/functions/evaluate-sentence/mock.ts` |

```bash
supabase secrets set EVALUATE_MODE=real   # enable real calls
supabase secrets unset EVALUATE_MODE      # back to mock
supabase secrets list                     # what is set right now
```

The toggles are intentionally separate — never collapse them into one shared
flag, since each guards a different cost.

`GENERATE_MODE` additionally doubles as a model selector for the real path
(matched case-insensitively): `real` runs the default Haiku→Sonnet fallback,
`sonnet` pins generation to Sonnet only, and `haiku` pins it to Haiku only.
Any other value (or unset) is still mock.

## README screenshots

The three images in the README live in `docs/screenshots/*.jpg`. They are cropped
from full-resolution phone captures by `scripts/crop-screenshots.sh` — macOS
`sips` only, no dependencies. The script strips the top system status bar and the
bottom Android navigation bar while keeping the app's own UI, calibrated for
`1080x2340` captures with a 3-button nav bar (`TOP_CROP=120`, `BOTTOM_CROP=170`,
giving `1080x2050`); anything not matching `1080x2340` is skipped rather than
mis-cropped.

Raw captures go in `docs/screenshots/raw/` — **git-ignored on purpose**
(`docs/screenshots/raw/*.jpg`), an internal staging area; only the cropped outputs
are committed, and a `.gitkeep` keeps the otherwise-empty folder tracked. The
script always reads from `raw/` and writes to `docs/screenshots/`, so re-running
never double-crops.

To regenerate (the capture step is the user's — I can't drive the phone):

1. The user takes fresh full-resolution screenshots on the device and drops them
   into `docs/screenshots/raw/`, reusing the filenames the README references
   (`home.jpg`, `lookup.jpg`, `practice-sentence.jpg`).
2. Run `./scripts/crop-screenshots.sh` to write the cropped versions.
3. If the visible content changed (word counts, the looked-up word, its senses),
   update the matching `alt` text in the README table so it still describes the
   image.

## Design references

Designs live in a Claude Design project. Whenever a design is referenced — **including
when the user pastes a `claude.ai/design/...` URL** — read the frames through the
`DesignSync` MCP tool (`list_files`, then `get_file`), not by fetching the URL. The URL
only identifies the project; the actual frame markup is available exclusively via MCP.
