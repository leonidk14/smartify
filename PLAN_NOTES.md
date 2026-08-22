# Testing strategy for the app

## Context

the app has **no tests at all** — no runner, no config, no `*.test.*` file anywhere in the
repo (`TODO.md` carries the line "add proper tests"). The only gate between a mistake and
`main` is `npm run verify`, which checks types, lint and formatting: it proves the code
compiles and is tidy, and nothing about whether it still _works_. Every behavioural claim is
currently verified by hand on a phone.

The app is small (52 files, ~5,200 lines) but its risk is concentrated in places manual
testing reaches badly: an 8-state lookup panel, a 4-level hint ladder, an offline fallback
that only triggers when the network is down, and a push-reminder entry point that requires an
actual notification to exercise. Those are exactly the paths that break silently.

**Goal:** a suite that fails when a critical user action stops working or a key screen stops
rendering correctly — and that is trusted enough to be believed when it goes red.

**Scope:** the app only. Not the Deno edge functions.

---

## What the framing covers, and what it misses

The two stated pillars are right and both are kept:

- **UI doesn't break** → pixel screenshots of important states, in a real browser.
- **Logic doesn't break** → interaction tests of important flows.

Three things the framing leaves out, all folded into the plan below:

1. **A pure-logic tier.** The cheapest tests per bug caught aren't flows at all — they're
   functions. `normalize` vs `toKey` in
   [normalize.ts](app/routes/wordSearch/normalize.ts) are two _different_
   normalizations used for two different purposes; `nextWord` in
   [session.ts](app/store/session.ts) advances via `indexOf`, so a duplicated word in
   the queue loops forever; the three-branch `shouldRevalidate` in
   [layout.tsx](app/routes/layout.tsx) governs every refetch in the app. None of these
   are reliably reachable through a flow test, and all are testable in milliseconds.

2. **Fixture drift — the echo-chamber risk.** This is the single biggest threat to the
   suite's value. Every test below mocks the network, so the tests verify the app against
   _our fixtures_, not against the real edge functions. Responses are cast through
   `postFunction<T>` with **no runtime validation**, so if `generate-sentence` changes its
   response shape, every test stays green and production breaks. Edge functions are out of
   scope, so the mitigation is structural: **fixtures must be typed with the app's own
   exported types** (`LookupResult`, `VocabularyStore`, `GeneratedSentence`,
   `SentenceEvaluation`), making `npm run typecheck` the thing that catches drift. This is a
   hard requirement of the design, not a nicety.

3. **Validating the suite itself.** A suite never observed failing is not known to work.
   Phase 5 deliberately breaks things and confirms red.

### Alternatives considered and rejected

| Approach                           | Why not                                                                                                                                                                                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **jsdom + Testing Library for UI** | jsdom has no CSS layout engine, so it would catch none of this app's likely visual regressions — fixed action bars, drawer sizing, the swipe-row track, the blur/reveal preview. Real pixel comparison needs a real browser.                                                           |
| **Vitest 4 Browser Mode**          | Real Chromium and a single runner, and better at isolating dense per-component state matrices by props. But weaker mobile emulation than Playwright, a much newer screenshot API, and `addInitScript`-style pre-app-boot stubbing (which the keyboard work depends on) is less direct. |
| **Storybook + Chromatic**          | A natural catalogue for the ~60 enumerated states, but a large dependency and a second app to maintain for a one-developer project.                                                                                                                                                    |
| **DOM snapshot tests**             | Cheap, but assert structure rather than appearance — they go red on every refactor and stay green on real CSS breakage. Worst of both.                                                                                                                                                 |

---

## Decisions (locked)

| Decision                | Choice                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Browser tier            | **Playwright** — Chromium, pinned mobile viewport                                         |
| Where tests run         | **Locally, on demand.** `npm run verify` is _not_ changed                                 |
| Production code changes | **None.** Determinism is pinned externally from Playwright                                |
| Scope                   | **4 flows:** lookup→save · practice word · practice sentence · practice from notification |

Two consequences worth stating plainly up front:

- **Tests are not a gate.** Nothing runs them automatically, so the suite catches regressions
  only when invoked. This is a deliberate trade for lower friction; revisit by adding `test`
  to the `verify` chain once the suite has proven stable.
- **The Vitest tier is limited to already-exported functions.** The densest logic in the app —
  the hint-masking engine in
  [SentenceHelpers.tsx](app/routes/practice/practiceSentence/SentenceHelpers.tsx)
  (`maskWord`, `revealedLetterIndexes`, 3 levels of index arithmetic) and `buildHints` /
  `buildWordView` in [practiceWord.tsx](app/routes/practiceWord.tsx) — is
  module-private, so it gets covered only _indirectly_, through browser journeys. Accepted.
  The trigger to revisit is a masking bug slipping through; the fix at that point is a
  one-word `export` diff per function, no logic change.

---

## Architecture: two tiers

```
Tier 1  Vitest 4 (node)      pure logic, already-exported     ~40 tests   <2s
Tier 2  Playwright (Chromium) 4 journeys + screenshots        ~15 specs   ~60s
```

Both invoked on demand. Vitest is forced to v4: Vite **8.0.16** is installed and Vitest
4.1.10 is the first line declaring `vite: ^8` support (v3's peer range stops at 7).

### The one mock layer

Every edge-function call in the app funnels through **one** module —
[supabaseFunctions.ts](app/lib/supabaseFunctions.ts) (`postFunction` / `getFunction`
over axios, hitting `${VITE_SUPABASE_URL}/functions/v1/<name>`). There is no
`supabase.functions.invoke` and no `.from()` anywhere. That single choke point means one
`page.route("**/functions/v1/**")` handler covers `lookup`, `vocabulary-list`,
`vocabulary-save`, `vocabulary-mark-practice`, `vocabulary-delete`, `generate-sentence`,
`evaluate-sentence` and `subscribe`. No MSW needed.

---

## Safety: tests must never reach the real Supabase project

`vite.config.ts` sets `envDir: "../../"`, so the app reads the **root `.env`** —
which holds a real `VITE_SUPABASE_URL` and anon key. An unconfigured test run would point at
the live project, and `vocabulary-save` / `vocabulary-delete` are real writes.

Closed off in config, not by convention:

- Add a committed **`.env.test`** at the repo root with fake values
  (`VITE_SUPABASE_URL=http://supabase.test`). Verified: `.gitignore`'s pattern is bare `.env`,
  an exact match, so `.env.test` is not ignored.
- Playwright's `webServer` runs `react-router dev --mode test`. Verified: `--mode, -m` is a
  supported `dev` flag. Vite loads `.env.test` at higher priority than `.env`.
- Any request escaping the route handlers goes to a non-resolving host and fails loudly
  rather than silently succeeding against production.

---

## Tier 1 — Vitest (pure logic)

**New files:** `vitest.config.ts`, `*.test.ts` colocated beside each source file.

The config must be **separate from `vite.config.ts`** — the `reactRouter()` plugin does not
run under Vitest. Define a fresh config with `environment: "node"`, the `~/* → ./app/*` alias,
and **no `envDir`**.

| Target                                                                                                          | What it protects                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [normalize.ts](app/routes/wordSearch/normalize.ts)                                                     | `normalize` (strips `a\|an\|the\|to`, spaces→dashes, for answer comparison) vs `toKey` (strips apostrophes + non-alphanumerics, the store key). Divergence between them is a live bug source                                         |
| [session.ts](app/store/session.ts)                                                                     | `nextWord` (incl. the duplicate-word `indexOf` case), `parsePracticeMode` fallback to `both`, `firstStepPath`, and a full `startSession → recordResult → reset` store sequence                                                       |
| [layout.tsx](app/routes/layout.tsx) + [practiceSentence.tsx](app/routes/practiceSentence.tsx) | Both exported `shouldRevalidate` policies — pure given their args, and they decide every refetch in the app                                                                                                                          |
| [vocabulary.ts](app/routes/wordSearch/vocabulary.ts)                                                   | `readVocabulary`'s offline discrimination: an axios error **with** `.response` rethrows (server refused → error page), **without** falls back to the IndexedDB snapshot and sets `isFromOfflineCopy`. Effectively untestable by hand |
| [offlineCache.ts](app/lib/offlineCache.ts)                                                             | `saveSnapshot`/`readSnapshot` round-trip via `fake-indexeddb`                                                                                                                                                                        |
| [usage.ts](app/routes/wordSearch/usage.ts)                                                             | `formatUSD` precision switch below $0.01, `sumTokenUsage`                                                                                                                                                                            |
| [push.ts](app/lib/push.ts)                                                                             | `urlBase64ToUint8Array` (pure VAPID decode), `isBannerDismissed` 7-day TTL                                                                                                                                                           |
| [preselect.ts](app/routes/practice/preselect.ts), [formData.ts](app/lib/formData.ts)          | `parsePreselect` validation, `readTextField`'s `File`/`null` guard                                                                                                                                                                   |

**New dev deps:** `vitest`, `fake-indexeddb`.

---

## Tier 2 — Playwright (journeys + screenshots)

**New files:** `playwright.config.ts`, `tests/` (specs, fixtures, helpers).

**Key design choice — screenshots are assertions _along_ the journeys, not a parallel suite.**
One spec walks a flow, asserts behaviour at each step, and takes a baseline at each state
worth freezing. Halves the maintenance surface versus two independent suites.

### Config

- **Target the dev server, not the build.** `entry.client.tsx` registers the service worker
  only under `import.meta.env.PROD`, so the dev server avoids Workbox `clientsClaim` /
  `skipWaiting` / `navigateFallback` interfering with navigation and route interception. CSS
  and layout are identical. The production build and SW stay a manual check, per CLAUDE.md.
- **Pin the viewport explicitly** — `{ width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true }` — rather than `devices["Pixel 7"]`, so a Playwright upgrade that
  revises a device descriptor cannot invalidate every baseline at once.
- Chromium only. `toHaveScreenshot` disables CSS animations by default, which handles Mantine
  drawer transitions.
- Fonts are system stacks only (`-apple-system, BlinkMacSystemFont, …`) — no web fonts to
  flake. **Baselines are therefore macOS-specific** and would need full regeneration if the
  suite ever moves to Linux CI.

### Shared determinism fixture

One Playwright fixture applying every stub, so no spec re-derives them:

```ts
// pins the answer position in buildHints and the meaning picked by buildWordView
await page.addInitScript(() => {
  Math.random = () => 0.5;
});

// skips HINT_DELAY_MS (15s) without waiting 15 real seconds
await page.clock.install();

// only for keyboard-state screenshots: 844 - 508 - 0 = 336px inset
await page.addInitScript(() => {
  Object.defineProperty(window.visualViewport, "height", { value: 508 });
});
```

This is why no production change is needed. Without the `Math.random` stub,
[practiceWord.tsx:80](app/routes/practiceWord.tsx#L80) splices the correct answer at
a random index of 3 and [practiceWord.tsx:37](app/routes/practiceWord.tsx#L37) picks
a random meaning, so the word-quiz screen renders differently on every run and its baseline
would fail 100% of the time.

### Auth

`AuthProvider` hydrates from `supabase.auth.getSession()`, which reads a localStorage key
supabase-js derives from the project URL. Rather than guessing that key, sign in **once**
through the real `SignInDrawer` UI in `globalSetup` with `**/auth/v1/token**` mocked, then
persist and reuse Playwright `storageState`. Idiomatic, and robust to supabase-js internals.
Signed-out specs use a fresh empty context.

### Fixtures

`tests/fixtures/` — typed builders (`aVocabularyStore()`, `aLookupResult()`,
`aGeneratedSentence()`, `anEvaluation()`) annotated with the app's exported types, per the
drift requirement above. `data/vocabulary.json` is **git-ignored** (`.gitignore:19`) so it
cannot be a committed fixture — its shape is the template, but the data is authored fresh.

### The four journeys

**1. Lookup → save** — `/` → `+` → type → search → result → word appears in the list.
States: home empty · home with words · lookup idle · lookup loading · lookup result ·
lookup with keyboard inset · typo suggestion (`Did you mean…`) · nothing found.
Interaction asserts: cache-first hit skips the network; a miss calls `lookup` then
`vocabulary-save`; the layout revalidates and the list grows.

**2. Practice word (from the app)** — `/practice` → mode card → `/practice/select` → pick →
`/practice/:word` → wrong answer → hint → correct → `/practice/summary`.
States: practice start · select list (with the Marked/All/Random chips) · word input ·
hint revealed · wrong (attempts < 2, Try again present) · wrong (attempts ≥ 2, answer
revealed) · correct · summary.
Interaction asserts: `useBlockBack` blocks POP and toasts; the Next label switches between
"Next word →" / "To summary →" / "To sentences →"; summary tallies match the recorded results.

**3. Practice sentence (from the app)** — requires signed-in `storageState`, since sentence
modes are auth-gated in `practiceStart.tsx`.
`/practice/:word/sentence` → Suspense fallback → typed → evaluate → feedback.
States: "Building your sentence…" fallback · input · hint ladder levels 0/1/2/3 · correct
(score ≥ `NEAR_PERFECT_THRESHOLD`) · wrong with correction segments · `generationFailed` card
· answer drawer with keyboard inset.
Interaction asserts: the ladder auto-advances `-1 → 0` after `page.clock.fastForward(15_000)`;
reaching level 3 records the outcome as `revealed`, not `wrong`; a 500 from
`generate-sentence` renders the error card rather than the root ErrorBoundary.

**4. Practice from a notification** — two entry points, both reachable; actual push _delivery_
is not automatable and stays manual.

- _Cold start:_ deep-link `/practice/preview?words=a,b&mode=word` (the URL `send-reminders`
  emits) → blurred list → "See the words first" → revealed → start → session.
- _Warm app:_ dispatch the `PUSH_NAVIGATE` message that
  [push-sw.js](public/push-sw.js) posts and `layout.tsx` listens for, asserting the
  app navigates. **Spike this in Phase 0** — if driving the message proves awkward without a
  registered SW, cover the cold-start path only and note the gap.

**New dev deps:** `@playwright/test`.

---

## Integration cost (all real, all small)

| Item                                             | Action                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tsconfig.json` `include: ["**/*"]`              | Test files and both new configs are automatically type-checked by `npm run typecheck`. No include change — but also no escape hatch, so test code must satisfy `strict` + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` (`import type` for type-only imports)                                                                                                        |
| `tsconfig.json` `types: ["node", "vite/client"]` | An explicit allowlist. Import `describe`/`it`/`expect` from `"vitest"` directly rather than enabling globals, and this needs no change at all                                                                                                                                                                                                                              |
| `eslint.config.js`                               | `strictTypeChecked` will fire routinely on test code (`no-unsafe-assignment`, `no-non-null-assertion`, `unbound-method`). CLAUDE.md **bans call-site `eslint-disable` outright**, so the only legal route is a scoped override block for `**/*.test.ts` + `tests/**` — carrying the required comment stating it is the _rule is wrong about what the code means here_ case |
| `.prettierignore` (per workspace)                | Add `test-results/`, `playwright-report/`, and the screenshot baseline directory                                                                                                                                                                                                                                                                                           |
| `.gitignore`                                     | Add `test-results/`, `playwright-report/`. **Screenshot baselines must be committed** — they are the assertion                                                                                                                                                                                                                                                             |
| `package.json` scripts                           | the app: `test`, `test:e2e`, `test:e2e:update`. Root: matching `-w smartify` passthroughs, following the existing pattern                                                                                                                                                                                                                                               |
| `npm run verify`                                 | **Unchanged**, per decision. Recorded here as a conscious gap, not an oversight                                                                                                                                                                                                                                                                                            |

---

## Phasing

**Phase 0 — spike (do this first; it de-risks everything else).** Prove, in throwaway code:
Vitest 4 runs one trivial test with `reactRouter()` excluded · Playwright boots
`react-router dev --mode test` and reaches a mocked lookup result · the `storageState` sign-in
approach works · the `PUSH_NAVIGATE` message is drivable · **the same screenshot is byte-identical across three consecutive runs**. If screenshots prove unstable here, stop and
resolve it before writing 15 baselines on a shaky foundation.

**Phase 1** — Vitest config + the Tier 1 table. Delivers value with zero browser complexity.

**Phase 2** — Playwright config, typed fixtures, the shared determinism fixture, journey 1.

**Phase 3** — Journeys 2, 3, 4.

**Phase 4** — Keyboard-inset and error-state screenshots.

**Phase 5** — Validate the suite (below).

---

## Verification

Automated, run by me:

```bash
npm run test              # Vitest, expect <2s
npm run test:e2e          # Playwright, expect ~60s
npm run test:e2e:update   # regenerate baselines after an intentional UI change
npm run verify            # must still pass — new files are linted, typed and formatted
```

**Phase 5, validating the suite** — a suite never seen failing is not known to work. Make each
change, confirm the _expected_ test goes red, revert:

| Break                                                        | Must fail                          |
| ------------------------------------------------------------ | ---------------------------------- |
| Flip `NEAR_PERFECT_THRESHOLD` 8 → 20 in `constants.ts`       | Journey 3 correct-answer assertion |
| Swap `normalize` for `toKey` at an answer-comparison site    | Tier 1 normalize tests             |
| Delete `bottom={keyboardInset}` in `lookupPanel.tsx:226`     | The keyboard-inset screenshot      |
| Make `readVocabulary` rethrow on a response-less axios error | Tier 1 offline-fallback test       |
| Remove a `<Group>` wrapper from `practiceStart.tsx`          | The practice-start screenshot      |

Manual, yours (per CLAUDE.md — I will not drive the app):

1. The **real keyboard** on a real phone across the lookup panel, practice action bar, and
   every bottom sheet. No tier automates this; the `visualViewport` stub tests the app's
   _response_ to a keyboard, not the keyboard.
2. **Production build + service worker** — install the PWA, go offline, confirm the
   `IconCloudOff` badge and the cached word list. Tests run against the dev server, where the
   SW is not registered.
3. **A real push notification** end to end. Only the URL it opens is automated.
4. First `npm run test:e2e:update` run — **review every generated baseline by eye** before
   committing. A baseline captured from a broken screen silently certifies the bug.

---

## Known gaps

Deliberate, listed so they are choices rather than surprises:

- **Signed-out / sample-word mode is not in the four flows** — yet it changes real behaviour
  (lookup blocked with "Sign in to look up new words", practice-later disabled, sentence modes
  locked, delete hidden on public rows). It is the state a _first-time visitor_ sees. Cheapest
  possible addition: one extra spec reusing journey 1 with an empty storage state.
- Module-private logic (hint masking, `buildHints`, `buildWordView`, `toStoredGroups`) is
  covered only indirectly.
- Edge functions, the service worker, PWA install, offline behaviour, real
  push delivery, cross-browser, and accessibility auditing are all out of scope.
- No CI: the suite is a tool you invoke, not a gate.
