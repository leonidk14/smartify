# smartify landing

The public marketing page. A static bundle — plain HTML and CSS, **no JavaScript
shipped**. Vite is here only as a dev server and asset hasher.

It is fully independent of the PWA in `apps/web`: separate port, separate build
output, separate deploy. Nothing here touches the app's service worker or manifest.

```bash
npm run landing:dev     # :5174 (the app keeps :5173 — both can run at once)
npm run landing:build   # → apps/landing/dist
npm run landing:preview # serve the built output
```

## Pointing the CTAs at the app

The four "start practicing" links use Vite's HTML env replacement — `%VITE_APP_URL%`
in `index.html`, substituted at build time. There is no plugin and no config file
behind it.

```bash
VITE_APP_URL=https://app.example.com npm run landing:build
```

Unset, both scripts fall back to `http://localhost:5173`, so `landing:dev` links
straight at your local app.

## Deploying

Publish `apps/landing/dist` to any static host. Keep the app on its own origin (e.g.
`app.example.com`) so its service-worker scope and manifest `start_url` stay `"/"`.

## Files

| File         |                                                                                 |
| ------------ | ------------------------------------------------------------------------------- |
| `index.html` | the whole page — nav, hero + phone mock, stats, features, why, how, CTA, footer |
| `styles.css` | all styling; palette and type stacks are custom properties at the top           |
| `public/`    | favicon, apple touch icon, OG image                                             |

Design source: `Landing.dc.html` in the Claude Design project, read via the
`DesignSync` MCP tool.

## Outstanding copy

The **"Why I built it"** section is three bracketed placeholders. It's a personal
account of why the project exists and can't be derived from the code — it needs to be
written by hand before this page goes public.
