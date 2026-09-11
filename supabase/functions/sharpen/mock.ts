import { buildTokenUsage, type TokenUsage } from "../_shared/usage.ts";
import type { RawSuggestion } from "./anchoring.ts";

// Mirrors the three suggestions on STANDUP_RECORDING in
// app/routes/speech/speechFixtures.ts — Deno functions can't import from
// app/, so they're duplicated here. The mock doesn't read the transcript at
// all; anchoring is what decides whether these phrases actually occur in
// whatever the caller typed, exactly as it will for real model output.
const MOCK_SUGGESTIONS: RawSuggestion[] = [
  {
    original: "really wanted to do",
    occurrenceIndex: 1,
    alternatives: [
      {
        phrase: "set out to do",
        register: "neutral",
        inSentence:
          "The thing we set out to do was make the whole process a lot better for the people using it…",
        vocabularyWord: "to set out",
      },
      {
        phrase: "endeavored to accomplish",
        register: "formal",
        inSentence:
          "The thing we endeavored to accomplish was make the whole process a lot better for the people using it…",
        vocabularyWord: "to endeavor",
      },
      {
        phrase: "were trying to do",
        register: "plain",
        inSentence:
          "The thing we were trying to do was make the whole process a lot better for the people using it…",
        vocabularyWord: "to try",
      },
    ],
  },
  {
    original: "a lot better",
    occurrenceIndex: 1,
    alternatives: [
      {
        phrase: "markedly smoother",
        register: "neutral",
        inSentence:
          "…make the whole process markedly smoother for the people using it",
        vocabularyWord: "markedly",
      },
      {
        phrase: "appreciably better",
        register: "formal",
        inSentence:
          "…make the whole process appreciably better for the people using it",
        vocabularyWord: "appreciably",
      },
      {
        phrase: "far less painful",
        register: "plain",
        inSentence:
          "…make the whole process far less painful for the people using it",
        vocabularyWord: "painful",
      },
    ],
  },
  {
    original: "kind of a mess",
    occurrenceIndex: 1,
    alternatives: [
      {
        phrase: "unwieldy",
        register: "neutral",
        inSentence:
          "…because right now it's unwieldy and everyone just works around it.",
        vocabularyWord: "unwieldy",
      },
      {
        phrase: "in a state of disarray",
        register: "formal",
        inSentence:
          "…because at present it remains in a state of disarray, and colleagues continually work around it.",
        vocabularyWord: "disarray",
      },
      {
        phrase: "a real headache",
        register: "plain",
        inSentence:
          "…because right now it's a real headache and everyone just works around it.",
        vocabularyWord: "headache",
      },
    ],
  },
];

const MOCK_USAGE: TokenUsage = buildTokenUsage({
  inputTokens: 410,
  outputTokens: 186,
});

export async function sharpenMock(): Promise<{
  suggestions: RawSuggestion[];
  usage: TokenUsage;
}> {
  const delay = 500 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  return { suggestions: MOCK_SUGGESTIONS, usage: MOCK_USAGE };
}
