import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import {
  billedSource,
  type KeySource,
  resolveLlmAccess,
} from "../_shared/llmAccess.ts";
import type { TokenUsage } from "../_shared/usage.ts";
import { evaluateFresh, type SentenceEvaluation } from "./evaluation.ts";
import { evaluateMock } from "./mock.ts";

interface EvaluateBody {
  word?: unknown;
  meaning?: unknown;
  original?: unknown;
  userSentence?: unknown;
}

function respond({
  word,
  evaluation,
  usage,
  source,
  billedTo,
}: {
  word: string;
  evaluation: SentenceEvaluation;
  usage: TokenUsage;
  source: string;
  billedTo: KeySource;
}): Response {
  console.log(
    `[evaluate-sentence] "${word}" (${source}, ${billedTo} key) — in:${usage.inputTokens} out:${usage.outputTokens} cost:${usage.totalCost}`,
  );
  return jsonResponse({ evaluation, usage, source, billedTo });
}

// TODO(auth): scope to the authenticated user once auth exists.
serveFunction(async (req) => {
  // POST, not GET like the sibling `lookup`: the learner's sentence is
  // unbounded free text, and a GET would put it in gateway access logs and
  // expose a token-spending endpoint to prefetchers.
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  let body: EvaluateBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const { word, meaning, original, userSentence } = body;

  // `original` may be blank when sentence generation degraded, so it is only
  // required to be a string.
  if (
    typeof word !== "string" ||
    !word.trim() ||
    typeof meaning !== "string" ||
    !meaning.trim() ||
    typeof original !== "string" ||
    typeof userSentence !== "string" ||
    !userSentence.trim()
  ) {
    return errorResponse(
      "Expected { word: string, meaning: string, original: string, userSentence: string }",
    );
  }

  const key = word.trim().toLowerCase();

  const isMockMode = Deno.env.get("EVALUATE_MODE") !== "real" &&
    Deno.env.get("EVALUATE_MODE") !== "haiku" &&
    Deno.env.get("EVALUATE_MODE") !== "sonnet";
  if (isMockMode) {
    const mock = await evaluateMock(key);
    return respond({ word: key, ...mock, source: "mock", billedTo: "none" });
  }

  const access = await resolveLlmAccess({
    userId: user.id,
    functionName: "evaluate-sentence",
  });

  const fresh = await evaluateFresh({
    access,
    word: key,
    meaning,
    original,
    userSentence,
  });

  return respond({
    word: key,
    ...fresh,
    source: "haiku",
    billedTo: billedSource(access),
  });
});
