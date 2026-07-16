# Welcome to React Router!

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

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

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

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
