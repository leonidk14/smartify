// The fake backend every story talks to, so the MSW handlers can match on an
// absolute URL. Both consumers are needed and neither covers the other:
// `main.ts` compiles it into a Vite `define` for `storybook dev`, while the
// `vitest` run reads it from `test.env` — Vitest's `vitest:meta-env-replacer`
// plugin rewrites `import.meta.env` to a runtime lookup before Vite's define
// plugin sees the source, so a `define` alone would leave the tests pointed at
// the real VITE_SUPABASE_URL from the root .env.
export const storybookSupabaseEnv = {
  VITE_SUPABASE_URL: "http://supabase.test",
  VITE_SUPABASE_ANON_KEY: "storybook-anon-key",
};
