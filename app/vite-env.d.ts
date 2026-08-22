/// <reference types="vite/client" />

// Vite types `import.meta.env` with an `any` index signature, which silently
// spreads `any` through every consumer. Declaring the app's own vars narrows
// them; they stay optional because a missing `.env` is a real state the app
// guards against rather than a build error.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
