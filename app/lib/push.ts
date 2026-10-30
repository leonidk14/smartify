import { notifications } from "@mantine/notifications";
import { postFunction, isSupabaseConfigured } from "./supabaseFunctions";

const BANNER_DISMISSED_KEY = "pushBannerDismissedAt";
const BANNER_DISMISS_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const BANNER_REFUSED_KEY = "pushBannerRefusedAt";

export function isPushSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// sessionStorage, not localStorage: localStorage can outlive a PWA uninstall, and a
// dismissal must not carry over to a reinstalled app.
export function isBannerDismissed(): boolean {
  try {
    const dismissedAt = Number(sessionStorage.getItem(BANNER_DISMISSED_KEY));
    if (!dismissedAt) {
      return false;
    }
    if (Date.now() - dismissedAt < BANNER_DISMISS_TTL_MS) {
      return true;
    }
    sessionStorage.removeItem(BANNER_DISMISSED_KEY);
    return false;
  } catch {
    return false;
  }
}

export function dismissBanner(): void {
  try {
    sessionStorage.setItem(BANNER_DISMISSED_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable (private mode / disabled) — nothing to persist.
  }
}

// localStorage on purpose, unlike the dismissal: "Don't ask again" is an explicit
// decision, so it should outlast closing the app.
export function isBannerRefused(): boolean {
  try {
    return localStorage.getItem(BANNER_REFUSED_KEY) !== null;
  } catch {
    return false;
  }
}

export function refuseBanner(): void {
  try {
    localStorage.setItem(BANNER_REFUSED_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable (private mode / disabled) — nothing to persist.
  }
}

function clearBannerRefusal(): void {
  try {
    localStorage.removeItem(BANNER_REFUSED_KEY);
  } catch {
    // localStorage unavailable (private mode / disabled) — nothing to clear.
  }
}

export type ReminderStatus = "on" | "off" | "blocked" | "unsupported";

export async function getReminderStatus(): Promise<ReminderStatus> {
  if (!isPushSupported()) {
    return "unsupported";
  }
  if (Notification.permission === "denied") {
    return "blocked";
  }
  if (Notification.permission === "default") {
    return "off";
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    return subscription ? "on" : "off";
  } catch {
    return "off";
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

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Handles its own errors (never throws), and needs an active service worker, so
// it only works on a production build (see `entry.client.tsx`).
export async function subscribeToPush(): Promise<void> {
  if (!isSupabaseConfigured() || !VAPID_PUBLIC_KEY) {
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

    await postFunction("subscribe", subscription.toJSON());

    notifications.show({ message: "Reminders on" });
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    notifications.show({
      color: "red",
      message: "Couldn’t turn on reminders. Please try again.",
    });
  }
}

// Clears any earlier "Don't ask again": granting is the newer decision, and a stale
// refusal would hide the banner if the permission later resets, as on a reinstall.
export async function enableReminders(): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    clearBannerRefusal();
    await subscribeToPush();
  }
}
