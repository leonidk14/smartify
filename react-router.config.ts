import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: false,
  future: {
    v8_middleware: true,
    v8_passThroughRequests: true,
    v8_splitRouteModules: true,
    v8_trailingSlashAwareDataRequests: true,
    // Keep this OFF: vite-plugin-pwa doesn't support React Router's Vite
    // Environment API build yet — with it enabled the service worker is emitted
    // to dist/ and precaches nothing. Re-enable once the plugin supports it.
    v8_viteEnvironmentApi: false,
  },
} satisfies Config;
