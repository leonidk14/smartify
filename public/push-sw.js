const DEFAULT_URL = "/practice";

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "Ready to practice?";
  const body = payload.body || "A few minutes keeps it sticky.";
  const url = payload.url || DEFAULT_URL;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { url },
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: payload.tag,
    }),
  );
});

// Wired up in Phase 3 (focus/navigate an open window, else open a new one).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
});
