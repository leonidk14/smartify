# smartify

An npm-workspaces monorepo with two independent apps:

| Path           | What                                          | Dev                           | Build output            |
| -------------- | --------------------------------------------- | ----------------------------- | ----------------------- |
| `apps/web`     | the PWA — React Router v7 SPA                 | `npm run dev` (:5173)         | `apps/web/build/client` |
| `apps/landing` | the marketing page — static HTML + CSS, no JS | `npm run landing:dev` (:5174) | `apps/landing/dist`     |

`supabase/`, `scripts/`, `data/` and `.env` stay at the root and are shared; every
command below runs from the repo root.

## LLM mode toggles (mock vs. real)

Every edge function that calls Anthropic has its own runtime toggle. Unset — or
set to anything other than `real` — means the function returns mock data
and spends no tokens. Mock is the default, so a fresh deploy can never start
billing by accident.

| Function            | Secret          | Mock data                                      |
| ------------------- | --------------- | ---------------------------------------------- |
| `lookup`            | `LOOKUP_MODE`   | `supabase/functions/lookup/mock.ts`            |
| `generate-sentence` | `GENERATE_MODE` | `supabase/functions/generate-sentence/mock.ts` |
| `evaluate-sentence` | `EVALUATE_MODE` | `supabase/functions/evaluate-sentence/mock.ts` |

The three are deliberately independent, so real sentence generation can be
enabled without also paying for real lookups.

```bash
# turn one on (real Anthropic calls)
supabase secrets set EVALUATE_MODE=real

# turn it back off (mock)
supabase secrets unset EVALUATE_MODE

# see what is currently set
supabase secrets list

# all three at once
supabase secrets set LOOKUP_MODE=real GENERATE_MODE=real EVALUATE_MODE=real
```

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the app's dev server with HMR:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

The landing page is a separate workspace and runs on its own port — both can be up at
the same time:

```bash
npm run landing:dev     # http://localhost:5174
npm run landing:build   # → apps/landing/dist
```

See [apps/landing/README.md](apps/landing/README.md) for how to point its CTAs at a
deployed app URL.

## Vocabulary data & seeding

App data (the vocabulary) lives in Supabase: the `vocabulary` Postgres table,
accessed via the `vocabulary-*` edge functions. The device's IndexedDB is only
an on-demand offline snapshot (header download button).

Seed data comes from `data/vocabulary.json` (a `VocabularyStore` snapshot). A
copy of it is kept in the private `seeds` Storage bucket as
`seeds/vocabulary.json`, serving as a fallback/restore source.

```bash
# one-time setup: apply migrations and deploy the functions
supabase db push
supabase functions deploy vocabulary-list vocabulary-save vocabulary-mark-practice vocabulary-bulk-put

# seed: uploads data/vocabulary.json to the seeds bucket AND upserts all words
node --env-file=.env scripts/seed-vocabulary.mjs

# restore the table from the Storage copy instead of the local file
node --env-file=.env scripts/seed-vocabulary.mjs --from-storage
```

The seed script requires `SUPABASE_URL` (or `VITE_SUPABASE_URL`) and
`SUPABASE_SERVICE_ROLE_KEY` in `.env` (see `.env.example`). The service-role
key bypasses RLS — keep it out of `VITE_`-prefixed vars.

## Practice reminders (push)

Subscribed devices get one push per day at **20:00 Europe/Berlin** — _"Ready to
practice? / 5 words are waiting."_ — carrying 5 words chosen from the vocabulary:
the ones marked for practice first, topped up with other saved words. The words
themselves stay out of the notification text (a lock screen is not the place for
vocabulary) and ride in the link instead.

Tapping it opens `/practice/session?mode=both&words=…`, which rebuilds the
session queue from the URL and drops the user on the first word; the run does
the word step for all 5, then the sentence step for all 5.

### Sending one by hand

```bash
# `force` bypasses the 20:00 window — without it, a send outside that hour
# is skipped exactly like the scheduler's off-hour run
curl -X POST "$VITE_SUPABASE_URL/functions/v1/send-reminders" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"force":true}'
```

In Postman: `POST {{supabase_url}}/functions/v1/send-reminders`, the same two
key headers, body raw/JSON.

## Building for Production

Create a production build:

```bash
npm run build
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
