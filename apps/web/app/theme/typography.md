# Typography catalog

Single source of truth is [`app/theme/typography.ts`](./typography.ts): one `recipes` literal
that derives two exports — `text` (spread onto Mantine components) and `textCss` (for
`styles={{}}` slots that props cannot reach). [`app/theme.ts`](../theme.ts) consumes the same
constants for `fontFamily`, `fontSizes` and `headings.sizes`.

Companion doc: [`colors.md`](./colors.md).

```tsx
import { text, textCss } from "../../theme/typography";

<Text {...text.label} mb={6}>Answer</Text>
<Text {...text.displayMd} tt="capitalize">{word}</Text>
<Textarea styles={{ input: { padding: "14px 15px", ...textCss.body } }} />
```

Tokens carry **family, size, line-height, weight, style, letter-spacing** only. They never carry
`tt="capitalize"` (a content decision) or layout props (`mb`/`mt`/`px`) — pass those at the call
site. `c` is baked in only where the color is invariant across every use (`label`, `meta`,
`metaLg`, `annotation` → `dimmed`); a later prop still overrides it.

---

## 1. The scale

**Families** — exposed as `--font-family-{sans,serif,mono}` by `cssVariablesResolver`.

| Token | Value |
| --- | --- |
| `sans` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` |
| `serif` | `Georgia, "Times New Roman", serif` |
| `mono` | `ui-monospace, Menlo, Consolas, monospace` |

The `--font-family-*` prefix avoids colliding with Tailwind v4's default `--font-sans` /
`--font-serif` / `--font-mono`.

**Sizes** — 8 steps. `theme.fontSizes` maps Mantine's `size=` scale onto the same numbers, so
controls and text share one scale.

| Key | px | Mantine `size=` |
| --- | --- | --- |
| `xs` | 11 | — |
| `sm` | 12 | `xs` |
| `md` | 13 | — |
| `lg` | 14 | `sm` |
| `xl` | 16 | `md` |
| `display3` | 18 | `lg` |
| `display2` | 22 | `xl` |
| `display1` | 26 | — |

**Weights:** `regular` 400 · `medium` 500 · `semibold` 600.
**Line-heights:** `tight` 1.1 · `snug` 1.35 · `body` 1.5.

## 2. The 15 tokens

| Token | Family | Size / lh / weight | Role |
| --- | --- | --- | --- |
| `displayLg` | serif | 26 / 1.1 / 400 | page titles, hero word, stat value |
| `displayMd` | serif | 22 / 1.1 / 400 | section titles, secondary word |
| `displaySm` | serif | 18 / 1.1 / 400 | word in a list row |
| `prose` | serif | 26 / 1.35 / 400 | the definition prompt (multi-line) |
| `proseSm` | serif | 16 / 1.5 / 400 | serif body copy, hint words, answer echo |
| `annotation` | serif | 13 / italic / 400 / dimmed | part-of-speech, inline asides |
| `label` | mono | 11 / 500 / uppercase / .5px / dimmed | **every** eyebrow label |
| `meta` | mono | 12 / 400 / dimmed | counts, progress, supporting notes |
| `metaLg` | mono | 14 / 500 / dimmed | the looked-up word, prominent meta |
| `body` | sans | 16 / 1.5 | default body copy |
| `bodySm` | sans | 14 / 1.5 | secondary/dimmed copy |
| `bodyXs` | sans | 13 / 1.5 | dense card copy, captions |
| `uiLabel` | sans | 14 / 1.5 / 600 | card titles, UI emphasis |
| `headline` | sans | 22 / 1.1 / 600 | feedback headline |
| `emphasis` | — | 600 | inline `<Text span>` emphasis (inherits size) |

`<Title>` needs no props — `theme.headings.sizes` maps h1/h2/h3 to
`displayLg`/`displayMd`/`displaySm`.

## 3. What this replaced

| | Before | After |
| --- | --- | --- |
| Font sizes | 17 (10, 11, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 19, 20, 22, 24, 25, 26) | 8 |
| Weights | 4 (400, 500, 600, 700) | 3 |
| Line-heights | 6 (1.1, 1.3, 1.35, 1.45, 1.5, 1.55) | 3 |
| Distinct recipes | 34 | 15 |
| Styling mechanisms | 5 | 1 |
| Webfonts | Inter (downloaded, never painted) | none |

Biggest consolidations: **26 mono eyebrow labels across 4 recipes and 3 separate
implementations → `label`**; **12 serif heading/word recipes → 3**; **11 sans body recipes → 3**.

Inter was loaded by `root.tsx` and set as Tailwind's `--font-sans`, but `theme.fontFamily` was
never set, so `@mantine/core/styles.css`'s `body { font-family: var(--mantine-font-family) }`
(imported after `app.css`) won with the `-apple-system` default. The font downloaded on every
page load and rendered nothing. Removed; `theme.fontFamily` is now explicit.

## 4. Where the look changed

The migration merged rather than preserving 1:1. Max size shift is ±2px.

| Where | Change |
| --- | --- |
| `lookupPanel.tsx` `<Title order={2}>` | 700/26/1.35 → 400/22/1.1 — was the only 700-weight heading, unstyled by accident |
| `practiceSummary` / `practiceSelect` empty states | 18 → 16 |
| `layout` header · `signInDrawer` title · `practiceSummary` stat | +2px |
| 3 inline bold spans | 700 → 600 |
| all 26 eyebrow labels | now uniformly mono 11/500 |
| `practiceWord` answer input (`size="xl"`) | 20 → 22, via the `fontSizes` remap |

Literal-caps strings (`YOUR ANSWER`, `CORRECT`, `REPHRASED`, …) were lowercased in source, since
`label` now applies `tt="uppercase"` itself.

Two sites the merge map assigned to `label` were reassigned to `meta` during implementation
because their content is a sentence, not a label, and uppercasing it would read wrong:
`practiceSummary` ("3 of 5 correct · nice work") and `feedbackHeader`'s `note`
("That reads naturally — nicely done").

## 5. Follow-ups (not done)

- **No lint guard.** The repo has no ESLint, so nothing mechanically stops a raw `fz={13.7}`.
  A `no-restricted-syntax` rule on `JSXAttribute[name.name=/^(fz|fw|lh)$/]` would cover it.
- **The inverse sign-in card is still duplicated** between `vocabularyHome.tsx` and
  `practiceStart.tsx` — identical markup, now identical tokens. A shared component would remove it.
- **`apps/landing` is untouched** and uses different families (Newsreader / IBM Plex Mono). Worth
  a shared plain-CSS token file only if the two properties should look like one product.
