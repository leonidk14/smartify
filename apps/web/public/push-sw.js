const DEFAULT_URL = "/practice";

self.addEventListener("push", (event) => {
  let payload;
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "Ready to practice?";
  const body = payload.body || "Your words are waiting.";
  const previewUrl = payload.previewUrl || DEFAULT_URL;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      data: { previewUrl, practiceUrl: payload.practiceUrl },
      icon: "/pwa-192x192.png",
      badge: "/badge.png",
      tag: payload.tag,
      actions: [{ action: "practice", title: "Practice without preview" }],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const url =
    event.action === "practice" && data.practiceUrl
      ? data.practiceUrl
      : data.previewUrl || DEFAULT_URL;

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
