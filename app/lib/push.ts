const BANNER_DISMISSED_KEY = "pushBannerDismissedAt";
const BANNER_DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

export function isPushSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isBannerDismissed(): boolean {
  try {
    const dismissedAt = Number(localStorage.getItem(BANNER_DISMISSED_KEY));
    if (!dismissedAt) {
      return false;
    }
    if (Date.now() - dismissedAt < BANNER_DISMISS_TTL_MS) {
      return true;
    }
    localStorage.removeItem(BANNER_DISMISSED_KEY);
    return false;
  } catch {
    return false;
  }
}

export function dismissBanner(): void {
  try {
    localStorage.setItem(BANNER_DISMISSED_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable (private mode / disabled) — nothing to persist.
  }
}

/** Decode a URL-safe base64 VAPID key into the Uint8Array `pushManager.subscribe` expects. */
export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function subscribeToPush(): Promise<void> {
  // TODO: subscribe via pushManager and POST to the `subscribe` Edge Function.
}
