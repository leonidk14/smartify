import type { StorybookConfig } from "@storybook/react-vite";

import { dirname } from "path";

import { fileURLToPath } from "url";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
const config: StorybookConfig = {
  stories: ["../**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  // Both mount at the server root. The MSW worker is kept out of the app's own
  // public/ because Vite copies that directory verbatim into build/client, which
  // would ship the worker to production and precache it in sw.js.
  staticDirs: ["../public", "./public"],
  addons: [
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-mcp"),
  ],
  framework: getAbsolutePath("@storybook/react-vite"),
  viteFinal: (config) => ({
    ...config,
    define: {
      ...config.define,
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        "http://supabase.test",
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY":
        JSON.stringify("storybook-anon-key"),
    },
  }),
};
export default config;
