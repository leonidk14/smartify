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

| Path | What |
| --- | --- |
| `apps/web` | the PWA (React Router v7 SPA, Mantine). Workspace name `smartify`. |
| `apps/landing` | the public marketing page. Plain HTML + CSS on Vite, **ships zero JS** — never add a framework or a runtime dependency to it. Workspace name `smartify-landing`. |
| `supabase/` `scripts/` `data/` `.env` | root-level, shared. Their commands run from the root unchanged. |

The root `package.json` has **no dependencies** — it is workspace wiring plus script
aliases. Add dependencies to the owning app, never to the root.

```bash
npm run dev / build / serve / typecheck   # apps/web, on :5173
npm run landing:dev / landing:build       # apps/landing, on :5174
```

`apps/web/vite.config.ts` sets `envDir: "../../"` so the app reads the root `.env` —
if `VITE_*` values ever come back undefined, check that first. The build's SW step
resolves as `node ../../scripts/generate-sw.mjs` from the `apps/web` CWD.

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
- **Explicit beats clever — don't make changes land via shared references.** Never
  mutate a nested node and rely on that silently updating a root object you save
  elsewhere (`chosen.usageCount += 1` … later … `save(tree)`). The reader has to
  chase aliases across functions to see that they are the same object. Instead have
  helpers take what they read and _return_ what they changed, so the data flow is
  visible at the call site:
  `await save(withUsageCountIncremented({ tree, index }))`. Simplicity over
  smartness — if following a value requires tracing references, restructure it.

## Vocabulary data & seeding

Vocabulary lives in the Supabase Postgres table `vocabulary` (one row per word:
`word` PK, `groups` jsonb, `should_practice_later`, `saved_at`), accessed by the
SPA exclusively through the `vocabulary-*` edge functions
(`supabase/functions/vocabulary-{list,save,mark-practice,bulk-put}`). IndexedDB
(`smartify-vocabulary`, via [apps/web/app/lib/offlineCache.ts](apps/web/app/lib/offlineCache.ts))
is only an on-demand offline snapshot, not a source of truth.

Seed data:

- **Local seed file:** [data/vocabulary.json](data/vocabulary.json) — a full
  `VocabularyStore` snapshot (`{ [word]: { groups, shouldPracticeLater, savedAt } }`,
  see [apps/web/app/routes/wordSearch/vocabulary.ts](apps/web/app/routes/wordSearch/vocabulary.ts)
  for the types).
- **Cloud fallback copy:** the same file is stored in the private Supabase
  Storage bucket `seeds` as `seeds/vocabulary.json` (bucket created by the
  vocabulary migration).

To seed (or re-seed; upserts are idempotent):

```bash
# uploads data/vocabulary.json to the seeds bucket AND upserts all words
node --env-file=.env scripts/seed-vocabulary.mjs

# restore the table from the Storage copy instead of the local file
node --env-file=.env scripts/seed-vocabulary.mjs --from-storage
```

Requires in `.env`: `SUPABASE_URL` (or `VITE_SUPABASE_URL`) and
`SUPABASE_SERVICE_ROLE_KEY` (server secret — bypasses RLS, never expose via a
`VITE_` var). The migration must be applied first (`supabase db push`), since
the script needs the table and the `seeds` bucket to exist.

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

## Design references

Designs live in a Claude Design project. Whenever a design is referenced — **including
when the user pastes a `claude.ai/design/...` URL** — read the frames through the
`DesignSync` MCP tool (`list_files`, then `get_file`), not by fetching the URL. The URL
only identifies the project; the actual frame markup is available exclusively via MCP.
