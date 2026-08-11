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
    plugins: (config.plugins ?? []).filter((plugin) => {
      const isReactRouterPlugin =
        plugin !== null &&
        ((typeof plugin === "object" &&
          "name" in plugin &&
          plugin.name.startsWith("react-router")) ||
          (Array.isArray(plugin) &&
            plugin[0] !== null &&
            typeof plugin[0] === "object" &&
            "name" in plugin[0] &&
            plugin[0].name.startsWith("react-router")));

      return !isReactRouterPlugin;
    }),
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
