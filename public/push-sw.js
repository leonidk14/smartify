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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || DEFAULT_URL;

  event.waitUntil(
    (async () => {
      const clientList = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const client = clientList.find(
        (c) => new URL(c.url).origin === self.location.origin,
      );

      if (client) {
        await client.focus();
        client.postMessage({ type: "PUSH_NAVIGATE", url });
        return;
      }

      await clients.openWindow(url);
    })(),
  );
});
