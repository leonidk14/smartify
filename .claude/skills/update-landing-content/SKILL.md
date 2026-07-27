---
name: update-landing-content
description: >-
  Draft landing-page copy updates from app changes committed since the last
  content sync (marked by a Landing-content-sync marker in the commit message).
  Manual only — inspects commits, cross-checks the claim map, and edits
  apps/landing/index.html for review.
disable-model-invocation: true
argument-hint: "[optional: a git ref to diff from, overriding the marker anchor]"
allowed-tools: Read Edit Grep Bash(git log *) Bash(git diff *)
---

## What this does

Draft copy updates to `apps/landing/index.html` from the app changes committed since the
last content sync, for the user to review and commit. Manual only — the user always invokes
this; never commit or stage; never touch anything outside the edits described below.

## Steps

1. **Find the range and read the commits.** Locate the anchor — the most recent commit whose
   message carries the `Landing-content-sync` marker — by running:

   ```
   git log -1 --grep=Landing-content-sync --format=%H
   ```

   - **Prints a sha** → that's the anchor; read what shipped since with
     `git log --stat --oneline <sha>..HEAD`.
   - **Prints nothing** (first run, no marker yet) → show recent history with
     `git log --stat --oneline -15` and confirm the starting point with the user before
     editing anything.
   - **`$ARGUMENTS` holds a git ref** → use it as the anchor instead:
     `git log --stat --oneline $ARGUMENTS..HEAD`.

2. **Filter to landing-relevant commits.** Read [references/claim-map.md](references/claim-map.md).
   A commit matters **only if** it touches a source-of-truth path in the map, or adds a new
   user-facing capability — signalled by a new route in `apps/web/app/routes.ts` or a new
   file under `apps/web/app/routes/`, a new `PracticeMode`, or a new user-facing edge
   function under `supabase/functions/`. Ignore refactors, internal fixes, and styling that
   touch nothing on the map — name them as skipped so the reasoning is visible.

3. **Verify against the live source, not the commit message.** For each relevant commit,
   read the current value in its source file (e.g. `DEFAULT_COUNT`, `PracticeMode`) and
   compare it to what the landing currently claims. Follow each row's "also check" pointers
   so duplicated claims are all caught.

4. **Apply the changes to `apps/landing/index.html`** (text only; preserve the
   `%VITE_APP_URL%` tokens and the zero-JS / static-HTML constraint; don't touch the phone
   visual — see step 5; never commit or stage):
   - **Correct drift** in existing claims — stats band, feature cards and the "Six small
     things" count, `<head>`/OG meta that duplicates the hero, and the how-it-works steps.
   - **Draft new content** when a commit adds a user-facing capability that belongs on the
     landing: add a feature card matching the existing pattern (icon `<span>` + `<h3>` +
     `<p>`) and voice, bump the "Six small things" count word to match, and add a stat only
     if one genuinely fits. Be conservative — the card set is curated ("each built to remove
     a reason to stop"), so add only what a visitor would care about, not every new route or
     internal screen. When an addition changes the count (Six → Seven), call it out so the
     user can confirm the set still reads as intentional.

5. **Flag — never edit — the human-judgment items** (see the claim map's rules block): the
   **phone visual** (post that a human must verify whether the screenshot needs
   regenerating), the `#why` placeholders, aspirational claims not backed by a live constant
   (e.g. the "20:00" reminder while its cron is commented out), and `og.png`.

6. **Print a review summary:**
   - the anchor (or range) used;
   - each edit, labelled **drift-fix** or **NEW**, with the driving commit and the source
     constant or feature behind it;
   - the "needs your judgment" flags from step 5;
   - a reminder that the edits are uncommitted;
   - a ready-to-paste commit message that includes the `Landing-content-sync` marker. The
     skill finds the anchor by grepping messages for that string, so no value is needed —
     just keep the marker distinctive (don't shorten it to something like `LCS`, which could
     match unrelated commits and misplace the anchor):

     ```
     Sync landing copy with shipped features

     Landing-content-sync
     ```

   Committing the review both records the copy change and advances the anchor for next time.
