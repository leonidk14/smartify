import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // The .env files live at the monorepo root, not next to this config.
  envDir: "../../",
  server: {
    allowedHosts: [".ngrok-free.dev"],
  },
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
});
