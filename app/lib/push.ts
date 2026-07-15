import { notifications } from "@mantine/notifications";
import axios from "axios";

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
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Handles its own errors (never throws), and needs an active service worker, so
// it only works on a production build (see `entry.client.tsx`).
export async function subscribeToPush(): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !VAPID_PUBLIC_KEY) {
    console.error(
      "Push is not configured: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_VAPID_PUBLIC_KEY must be set.",
    );
    notifications.show({
      color: "red",
      message: "Reminders aren’t available right now.",
    });
    return;
  }

  try {
    if (!(await navigator.serviceWorker.getRegistration())) {
      console.warn(
        "No service worker registered — push only works on a production build.",
      );
      notifications.show({
        color: "red",
        message: "Reminders aren’t available here.",
      });
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    await axios.post(
      `${SUPABASE_URL}/functions/v1/subscribe`,
      subscription.toJSON(),
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );

    dismissBanner();
    notifications.show({ message: "Reminders on" });
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    notifications.show({
      color: "red",
      message: "Couldn’t turn on reminders. Please try again.",
    });
  }
}
