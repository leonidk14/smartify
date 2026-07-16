# Project conventions

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

Reference examples: [app/routes/practice/practiceStart.tsx](app/routes/practice/practiceStart.tsx),
[app/routes/practice/practiceSelect.tsx](app/routes/practice/practiceSelect.tsx).

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

## Vocabulary data & seeding

Vocabulary lives in the Supabase Postgres table `vocabulary` (one row per word:
`word` PK, `groups` jsonb, `should_practice_later`, `saved_at`), accessed by the
SPA exclusively through the `vocabulary-*` edge functions
(`supabase/functions/vocabulary-{list,save,mark-practice,bulk-put}`). IndexedDB
(`smartify-vocabulary`, via [app/lib/offlineCache.ts](app/lib/offlineCache.ts))
is only an on-demand offline snapshot, not a source of truth.

Seed data:

- **Local seed file:** [data/vocabulary.json](data/vocabulary.json) — a full
  `VocabularyStore` snapshot (`{ [word]: { groups, shouldPracticeLater, savedAt } }`,
  see [app/routes/wordSearch/vocabulary.ts](app/routes/wordSearch/vocabulary.ts)
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

## Design references

Designs live in a Claude Design project. Whenever a design is referenced — **including
when the user pastes a `claude.ai/design/...` URL** — read the frames through the
`DesignSync` MCP tool (`list_files`, then `get_file`), not by fetching the URL. The URL
only identifies the project; the actual frame markup is available exclusively via MCP.
