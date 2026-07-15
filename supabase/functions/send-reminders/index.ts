import webpush from "npm:web-push@3";
import { requireEnv } from "../_shared/env.ts";
import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";

interface Subscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

const REMINDER_PAYLOAD = JSON.stringify({
  title: "Ready to practice?",
  body: "A few minutes keeps it sticky.",
  url: "/practice",
});

// Triggered by pg_cron (or manually by an operator) — never called by the SPA.
serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  webpush.setVapidDetails(
    requireEnv("VAPID_SUBJECT"),
    requireEnv("VAPID_PUBLIC_KEY"),
    requireEnv("VAPID_PRIVATE_KEY"),
  );

  const supabase = createAdminClient();
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .returns<Subscription[]>();

  if (error) {
    return errorResponse(error.message, 500);
  }

  const expiredEndpoints: string[] = [];
  let sent = 0;

  await Promise.all(
    (subscriptions ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          REMINDER_PAYLOAD,
        );
        sent += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        } else {
          console.error(`Push failed for ${sub.endpoint}:`, err);
        }
      }
    }),
  );

  if (expiredEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  return jsonResponse({
    total: subscriptions?.length ?? 0,
    sent,
    pruned: expiredEndpoints.length,
  });
});
