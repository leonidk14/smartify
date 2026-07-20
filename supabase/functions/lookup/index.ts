import Anthropic from "npm:@anthropic-ai/sdk@0.110.0";
import { requireEnv } from "../_shared/env.ts";
import { serveFunction } from "../_shared/handler.ts";
import { errorResponse, jsonResponse } from "../_shared/http.ts";
import { buildTokenUsage } from "../_shared/usage.ts";
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

  const providedKey = req.headers.get("x-lookup-key");
  if (!providedKey || providedKey !== requireEnv("LOOKUP_AUTH_KEY")) {
    return errorResponse("Unauthorized", 401);
  }

  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  const lookupIndex = segments.indexOf("lookup");
  const slug =
    lookupIndex >= 0 && lookupIndex < segments.length - 1
      ? segments.slice(lookupIndex + 1).join("/")
      : "";
  const word = decodeURIComponent(slug).replaceAll("-", " ").trim();

  if (!word) {
    return errorResponse("Expected /lookup/<word-slug>");
  }

  if (Deno.env.get("LOOKUP_MODE") !== "real") {
    return jsonResponse(lookupMock(word));
  }

  const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: DICTIONARY_SYSTEM_PROMPT,
    output_config: { format: DICTIONARY_OUTPUT_FORMAT },
    messages: [{ role: "user", content: `Define: ${word}` }],
  });

  const raw = response.content[0];
  if (raw.type !== "text") {
    throw new Error("Unexpected response type from API");
  }

  const dictionary = parseDictionaryResponse(raw.text);
  const usage = buildTokenUsage({
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  console.log(
    `[lookup] "${word}" — in:${usage.inputTokens} out:${usage.outputTokens} cost:${usage.totalCost}`,
  );

  return jsonResponse({ dictionary, usage });
});
