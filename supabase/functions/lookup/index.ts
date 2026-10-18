import { getRequestUser } from "../_shared/auth.ts";
import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import {
  billedSource,
  resolveLlmAccess,
  sendMessageAndRecordUsage,
} from "../_shared/llmAccess.ts";
import {
  DICTIONARY_OUTPUT_FORMAT,
  DICTIONARY_SYSTEM_PROMPT,
  parseDictionaryResponse,
} from "./dictionary.ts";
import { lookupMock } from "./mock.ts";

serveFunction(async (req) => {
  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const user = await getRequestUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  const lookupIndex = segments.indexOf("lookup");
  const slug = lookupIndex >= 0 && lookupIndex < segments.length - 1
    ? segments.slice(lookupIndex + 1).join("/")
    : "";
  const word = decodeURIComponent(slug).replaceAll("-", " ").trim();

  if (!word) {
    return errorResponse("Expected /lookup/<word-slug>");
  }

  const isMockMode = Deno.env.get("LOOKUP_MODE") !== "real" &&
    Deno.env.get("LOOKUP_MODE") !== "haiku" &&
    Deno.env.get("LOOKUP_MODE") !== "sonnet";
  if (isMockMode) {
    return jsonResponse({ ...lookupMock(word), billedTo: "none" });
  }

  const access = await resolveLlmAccess({
    userId: user.id,
    functionName: "lookup",
  });

  const { message, usage } = await sendMessageAndRecordUsage({
    access,
    pricing: "haiku",
    params: {
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: DICTIONARY_SYSTEM_PROMPT,
      output_config: { format: DICTIONARY_OUTPUT_FORMAT },
      messages: [{ role: "user", content: `Define: ${word}` }],
    },
  });

  const raw = message.content[0];
  if (raw.type !== "text") {
    throw new Error("Unexpected response type from API");
  }

  const dictionary = parseDictionaryResponse(raw.text);
  const billedTo = billedSource(access);

  console.log(
    `[lookup] "${word}" (${billedTo} key) — in:${usage.inputTokens} out:${usage.outputTokens} cost:${usage.totalCost}`,
  );

  return jsonResponse({ dictionary, usage, billedTo });
});
