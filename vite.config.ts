/// <reference types="vitest/config" />
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { storybookSupabaseEnv } from "./.storybook/supabaseEnv";
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  server: {
    allowedHosts: [".ngrok-free.dev"],
  },
  // The React Router plugin must be left out whenever Storybook renders the
  // stories, in either of two contexts:
  //   - `storybook dev`/`build` (sets STORYBOOK=true): its Vite builder loads
  //     this file and resolves with `configFile: false`, which the plugin
  //     rejects outright — it needs the config path for its child compiler.
  //   - the `@storybook/addon-vitest` browser run (`vitest` sets VITEST=true):
  //     the plugin injects a React-Refresh preamble the browser tester never
  //     provides, failing every story import with "can't detect preamble".
  // In both, Storybook's own react-vite framework does the rendering, so the
  // plugin is redundant there. Everything else — Tailwind, tsconfig paths — is
  // shared as-is.
  plugins: [
    tailwindcss(),
    ...(process.env.STORYBOOK === "true" || process.env.VITEST === "true"
      ? []
      : [reactRouter()]),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          // Overrides the real values the .env supplies, so the stories reach
          // the MSW handlers instead of the live backend.
          env: storybookSupabaseEnv,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
                // Mobile-first PWA: run the browser tests at the same 393 width
                // as the Storybook default viewport and the Chromatic snapshot,
                // overriding Vitest's 414x896 default.
                viewport: { width: 393, height: 852 },
              },
            ],
          },
        },
      },
    ],
  },
});
