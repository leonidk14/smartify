import webpush from "npm:web-push@3";
import { requireEnv } from "../_shared/env.ts";
import { serveFunction } from "../_shared/handler.ts";
import {
  errorResponse,
  INTERNAL_ERROR,
  jsonResponse,
} from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";

interface Subscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface WordRow {
  word: string;
  groups: unknown;
  should_practice_later: boolean;
}

type PracticeMode = "word" | "sentence" | "both";

interface ReminderOptions {
  words: string[] | null;
  count: number;
  title: string;
  body: string | null;
  mode: PracticeMode;
  isForced: boolean;
}

const DEFAULT_COUNT = 5;
const DEFAULT_TITLE = "Ready to practice?";
const REMINDER_HOUR = 20;
const REMINDER_TIMEZONE = "Europe/Berlin";

function defaultBody(wordCount: number): string {
  return wordCount === 1
    ? "1 word is waiting."
    : `${wordCount} words are waiting.`;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isPracticeMode(value: unknown): value is PracticeMode {
  return value === "word" || value === "sentence" || value === "both";
}

function parseOptions(raw: unknown): ReminderOptions | { error: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { error: "Expected a JSON object body" };
  }

  const { words, count, title, body, mode, force } = raw as Record<
    string,
    unknown
  >;

  if (words !== undefined && !isNonEmptyStringArray(words)) {
    return { error: "Expected words to be an array of non-empty strings" };
  }
  if (
    count !== undefined &&
    (typeof count !== "number" || !Number.isInteger(count) || count < 1)
  ) {
    return { error: "Expected count to be a positive integer" };
  }
  if (title !== undefined && typeof title !== "string") {
    return { error: "Expected title to be a string" };
  }
  if (body !== undefined && typeof body !== "string") {
    return { error: "Expected body to be a string" };
  }
  if (mode !== undefined && !isPracticeMode(mode)) {
    return { error: 'Expected mode to be "word", "sentence" or "both"' };
  }
  if (force !== undefined && typeof force !== "boolean") {
    return { error: "Expected force to be a boolean" };
  }

  return {
    words: words?.map((word) => word.trim().toLowerCase()) ?? null,
    count: count ?? DEFAULT_COUNT,
    title: title ?? DEFAULT_TITLE,
    body: body ?? null,
    mode: mode ?? "both",
    isForced: force ?? false,
  };
}

function currentHourIn(timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );
}

function shuffle<T>(items: T[]): T[] {
  return items
    .map((item) => ({ item, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);
}

function pickWords({ rows, count }: { rows: WordRow[]; count: number }) {
  const practiceable = rows.filter(
    (row) => Array.isArray(row.groups) && row.groups.length > 0,
  );
  const marked = practiceable.filter((row) => row.should_practice_later);
  const rest = practiceable.filter((row) => !row.should_practice_later);

  return [...shuffle(marked), ...shuffle(rest)]
    .slice(0, count)
    .map((row) => row.word);
}

function buildPayload({
  words,
  title,
  body,
  mode,
}: {
  words: string[];
  title: string;
  body: string;
  mode: PracticeMode;
}): string {
  const query = new URLSearchParams({ mode, words: words.join(",") });
  return JSON.stringify({
    title,
    body,
    url: `/practice/session?${query}`,
    tag: "practice-reminder",
  });
}

// Triggered by pg_cron (or manually by an operator) — never called by the SPA,
// so it is gated on a shared secret rather than a user token. Without it, anyone
// holding the bundled anon key could push arbitrary text to every subscriber
// (`force` also skips the hour gate below).
serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  if (req.headers.get("x-reminders-secret") !== requireEnv("REMINDERS_SECRET")) {
    return errorResponse("Unauthorized", 401);
  }

  const rawBody = await req.json().catch(() => ({}));
  const options = parseOptions(rawBody ?? {});
  if ("error" in options) {
    return errorResponse(options.error);
  }

  const hour = currentHourIn(REMINDER_TIMEZONE);
  if (!options.isForced && hour !== REMINDER_HOUR) {
    return jsonResponse({
      skipped: true,
      reason: `${hour}:00 in ${REMINDER_TIMEZONE}, reminders go out at ${REMINDER_HOUR}:00`,
    });
  }

  webpush.setVapidDetails(
    requireEnv("VAPID_SUBJECT"),
    requireEnv("VAPID_PUBLIC_KEY"),
    requireEnv("VAPID_PRIVATE_KEY"),
  );

  const supabase = createAdminClient();

  let words = options.words;
  if (words === null) {
    const { data, error } = await supabase
      .from("vocabulary")
      .select("word, groups, should_practice_later")
      .returns<WordRow[]>();

    if (error) {
      console.error(error);
      return errorResponse(INTERNAL_ERROR, 500);
    }

    words = pickWords({ rows: data ?? [], count: options.count });
  }

  if (words.length === 0) {
    return jsonResponse({ skipped: true, reason: "No words to practice" });
  }

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .returns<Subscription[]>();

  if (error) {
    console.error(error);
    return errorResponse(INTERNAL_ERROR, 500);
  }

  const body = options.body ?? defaultBody(words.length);
  const payload = buildPayload({
    words,
    title: options.title,
    body,
    mode: options.mode,
  });

  const expiredEndpoints: string[] = [];
  let sent = 0;

  await Promise.all(
    (subscriptions ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
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
    words,
    mode: options.mode,
    title: options.title,
    body,
  });
});
