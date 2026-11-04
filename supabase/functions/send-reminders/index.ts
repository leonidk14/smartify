import webpush from "npm:web-push@3";
import type { SupabaseClient, User } from "npm:@supabase/supabase-js@2";
import { requireEnv } from "../_shared/env.ts";
import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { preferOwnRows } from "../_shared/vocabularyAccess.ts";

interface Subscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

interface WordRow {
  user_id: string;
  word: string;
  groups: unknown;
  should_practice_later: boolean;
}

interface Delivery {
  userId: string;
  words: string[];
  sent: number;
}

type PracticeMode = "word" | "sentence" | "both";

interface Recipient {
  email: string;
  userId: string;
}

interface ReminderOptions {
  emails: string[] | null;
  words: string[] | null;
  count: number;
  title: string;
  body: string | null;
  mode: PracticeMode;
  isForced: boolean;
}

const DEFAULT_COUNT = 5;
const DEFAULT_TITLE = "Ready to practice words?";
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

  const { emails, words, count, title, body, mode, force } = raw as Record<
    string,
    unknown
  >;

  if (
    emails !== undefined &&
    (!isNonEmptyStringArray(emails) || emails.length === 0)
  ) {
    return {
      error: "Expected emails to be a non-empty array of non-empty strings",
    };
  }
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
    emails: emails === undefined
      ? null
      : [...new Set(emails.map((email) => email.trim().toLowerCase()))],
    words: words?.map((word) => word.trim().toLowerCase()) ?? null,
    count: count ?? DEFAULT_COUNT,
    title: title ?? DEFAULT_TITLE,
    body: body ?? null,
    mode: mode ?? "both",
    isForced: (force ?? false) || emails !== undefined,
  };
}

async function listAllUsers(supabase: SupabaseClient): Promise<User[]> {
  const users: User[] = [];
  let page: number | null = 1;
  while (page !== null) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) {
      throw error;
    }
    users.push(...data.users);
    page = data.nextPage;
  }
  return users;
}

async function resolveRecipients({
  supabase,
  emails,
}: {
  supabase: SupabaseClient;
  emails: string[];
}): Promise<{ recipients: Recipient[]; unknownEmails: string[] }> {
  const userIdByEmail = new Map(
    (await listAllUsers(supabase)).flatMap((user) =>
      user.email === undefined ? [] : [[user.email.toLowerCase(), user.id]]
    ),
  );

  return {
    recipients: emails.flatMap((email) => {
      const userId = userIdByEmail.get(email);
      return userId === undefined ? [] : [{ email, userId }];
    }),
    unknownEmails: emails.filter((email) => !userIdByEmail.has(email)),
  };
}

async function readSubscriptions({
  supabase,
  userIds,
}: {
  supabase: SupabaseClient;
  userIds: string[] | null;
}): Promise<Subscription[]> {
  const query = supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id");

  const { data, error } =
    await (userIds === null ? query : query.in("user_id", userIds)).returns<
      Subscription[]
    >();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
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

// Cron carries no user JWT, so RLS cannot narrow this — the visibility rule is spelled
// out here instead: the subscriber's own words plus the public ones.
async function readWordsForUser({
  supabase,
  userId,
  count,
}: {
  supabase: SupabaseClient;
  userId: string;
  count: number;
}): Promise<string[]> {
  const { data, error } = await supabase
    .from("vocabulary")
    .select("user_id, word, groups, should_practice_later")
    .or(`is_public.eq.true,user_id.eq.${userId}`)
    .returns<WordRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return pickWords({
    rows: preferOwnRows({ visibleRows: data ?? [], userId }),
    count,
  });
}

function groupByUser(
  subscriptions: Subscription[],
): Map<string, Subscription[]> {
  const byUser = new Map<string, Subscription[]>();
  for (const subscription of subscriptions) {
    byUser.set(subscription.user_id, [
      ...(byUser.get(subscription.user_id) ?? []),
      subscription,
    ]);
  }
  return byUser;
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
    url: `/practice/preview?${query}`,
    tag: "practice-reminder",
  });
}

// Triggered by pg_cron (or manually by an operator) — never called by the SPA,
// so it is gated on a shared secret rather than a user token. Without it, anyone
// holding the bundled anon key could push arbitrary text to every subscriber
// (`force` also skips the hour gate below).
//
// `emails` narrows the send to those accounts' subscriptions and implies `force`. A
// single unknown address rejects the whole request before anything is pushed, since
// a notification cannot be recalled — a typo must not silently shrink the audience.
//
// Words are picked per subscriber so a reminder never names someone else's private
// word. The `words` override is exempt: it is an operator tool behind the secret,
// and goes to every targeted subscriber verbatim.
serveFunction(async (req) => {
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  if (
    req.headers.get("x-reminders-secret") !== requireEnv("REMINDERS_SECRET")
  ) {
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
      reason:
        `${hour}:00 in ${REMINDER_TIMEZONE}, reminders go out at ${REMINDER_HOUR}:00`,
    });
  }

  webpush.setVapidDetails(
    requireEnv("VAPID_SUBJECT"),
    requireEnv("VAPID_PUBLIC_KEY"),
    requireEnv("VAPID_PRIVATE_KEY"),
  );

  const supabase = createAdminClient();

  const targeting = options.emails === null
    ? null
    : await resolveRecipients({ supabase, emails: options.emails });

  if (targeting !== null && targeting.unknownEmails.length > 0) {
    return errorResponse(
      `No account for: ${targeting.unknownEmails.join(", ")}`,
    );
  }

  const subscriptions = await readSubscriptions({
    supabase,
    userIds: targeting?.recipients.map((recipient) => recipient.userId) ??
      null,
  });

  const subscribedUserIds = new Set(subscriptions.map((sub) => sub.user_id));
  const targetingReport = targeting === null ? {} : {
    notSent: targeting.recipients
      .filter((recipient) => !subscribedUserIds.has(recipient.userId))
      .map((recipient) => recipient.email),
  };

  const expiredEndpoints: string[] = [];
  const deliveries: Delivery[] = [];

  for (const [userId, userSubscriptions] of groupByUser(subscriptions)) {
    const words = options.words ??
      (await readWordsForUser({ supabase, userId, count: options.count }));

    if (words.length === 0) {
      continue;
    }

    const payload = buildPayload({
      words,
      title: options.title,
      body: options.body ?? defaultBody(words.length),
      mode: options.mode,
    });

    const results = await Promise.all(
      userSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          );
          return true;
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            expiredEndpoints.push(sub.endpoint);
          } else {
            console.error(`Push failed for ${sub.endpoint}:`, err);
          }
          return false;
        }
      }),
    );

    deliveries.push({
      userId,
      words,
      sent: results.filter(Boolean).length,
    });
  }

  if (expiredEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", expiredEndpoints);
  }

  if (deliveries.length === 0) {
    return jsonResponse({
      skipped: true,
      reason: "No words to practice",
      ...targetingReport,
    });
  }

  return jsonResponse({
    total: subscriptions.length,
    sent: deliveries.reduce((count, delivery) => count + delivery.sent, 0),
    pruned: expiredEndpoints.length,
    deliveries,
    mode: options.mode,
    title: options.title,
    ...targetingReport,
  });
});
