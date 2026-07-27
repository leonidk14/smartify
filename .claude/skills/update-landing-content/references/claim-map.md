# Landing claim → source-of-truth map

Every advertised claim on `apps/landing/index.html` mirrors a real constant or route in
`apps/web` / `supabase/`. Use this to decide which commits actually change a claim, and to
catch the same claim where it appears more than once. Verify against the **live source**,
never the commit message.

| Landing claim (and every place it appears) | Source of truth | Also check |
| --- | --- | --- |
| "3 modes — GUESS · REBUILD · BOTH"; "Guess the word" & "Rebuild the sentence" cards | [apps/web/app/store/session.ts](../../../../apps/web/app/store/session.ts) — `PracticeMode = "word" \| "sentence" \| "both"` | stat number, stat label, both feature cards; **flag** the phone visual |
| "5 words per daily reminder" | [supabase/functions/send-reminders/index.ts](../../../../supabase/functions/send-reminders/index.ts) — `DEFAULT_COUNT = 5` | **2 text spots**: stats band + hero lede; **flag** the phone mock's "5 DUE TODAY" for human verify |
| Reminder title / evening nudge | `send-reminders/index.ts` — `DEFAULT_TITLE`; cron time in the reminders migration | "20:00" is **not live** (cron commented out) — flag, don't assert |
| "Look up any word" / "Save it in a tap" | [apps/web/app/routes/wordSearch/](../../../../apps/web/app/routes/wordSearch/) | **flag** the phone visual (word list, "Your Vocabulary" header) — do not edit |
| Practice flow ("Pick a mode and a handful of words") | [apps/web/app/routes.ts](../../../../apps/web/app/routes.ts) — practice route tree | how-it-works steps 01–03 |
| "Six small things" feature count (`#features` subhead) | the `#features` card grid itself | the prose number ("Six") **and** the card count must move together |

## Rules

- **Skill edits (text only):** stats band, feature cards + their count, `<head>`/OG meta,
  how-it-works steps.
- **New features → draft new content:** when a commit ships a user-facing capability that
  isn't advertised yet, draft a matching feature card (icon + `<h3>` + `<p>`, existing
  voice), bump the "Six small things" count, and add a stat only if one fits. Label these
  **NEW** in the summary. Stay conservative — the card set is curated, so not every new route
  belongs; flag when the count changes so the user confirms the set still reads intentionally.
- **Flag for a human, never edit:**
  - the **phone visual** — post "verify whether the screenshot needs regenerating"; it is
    intended to become a real image, and that conversion is out of scope for this skill;
  - the `#why` placeholders (human-authored);
  - `og.png` (stale placeholder needing a real 1200×630 image).
- **Aspirational vs live:** only assert a claim as fact if a live constant backs it. The
  "20:00" reminder does not yet (its cron is commented out in the reminders migration) —
  flag it, don't assert it.
- **Duplication:** several claims appear 2–3× (the reminder count, the mode list, hero copy
  echoed in `<head>`/OG). Fixing one text instance without the others is a bug.
- **Constraints:** keep the `%VITE_APP_URL%` tokens intact and never add JS — the landing
  ships zero JavaScript.
