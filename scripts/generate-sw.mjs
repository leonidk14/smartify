// Post-build service-worker generation.
//
// vite-plugin-pwa runs during the Vite client bundle, which is BEFORE React
// Router emits index.html and its route manifest (manifest-[hash].js) in the
// SPA prerender phase — so those files never make it into the plugin's precache
// and the app breaks offline. We run workbox against the FINISHED build/client
// here instead, so everything (shell + route manifest + all chunks) is cached.
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { generateSW } from "workbox-build";

const outDir = "build/client";

// Drop vite-plugin-pwa's incomplete sw.js + its workbox runtime before we
// regenerate, so they aren't left orphaned or precached.
for (const name of await readdir(outDir)) {
  if (name === "sw.js" || /^workbox-.*\.js$/.test(name)) {
    await rm(path.join(outDir, name), { force: true });
  }
}

const { count, size, warnings } = await generateSW({
  globDirectory: outDir,
  globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}"],
  swDest: path.join(outDir, "sw.js"),
  inlineWorkboxRuntime: true,
  importScripts: ["/push-sw.js"],
  // Serve the cached shell for offline navigations. Rewrite the precached
  // index.html entry to "/" so the install-time fetch targets "/" (which every
  // host serves as index.html, with no /index.html redirect to trip over).
  navigateFallback: "/",
  navigateFallbackDenylist: [/^\/assets\//],
  manifestTransforms: [
    (entries) => ({
      manifest: entries.map((entry) =>
        entry.url === "index.html" ? { ...entry, url: "/" } : entry,
      ),
      warnings: [],
    }),
  ],
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
});

for (const warning of warnings) console.warn(warning);
console.log(
  `[pwa] service worker generated: ${count} entries precached (${(
    size / 1024
  ).toFixed(1)} KiB)`,
);
