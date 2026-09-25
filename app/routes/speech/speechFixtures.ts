import type { SpeechRecording } from "./speechTypes";

const HOUR_MS = 60 * 60 * 1000;

const STANDUP_TRANSCRIPT =
  "The thing we really wanted to do was make the whole process a lot better for the people using it, because right now it's kind of a mess and everyone just works around it.";

export const STANDUP_RECORDING: SpeechRecording = {
  id: "standup-update",
  title: "Standup update",
  transcript: STANDUP_TRANSCRIPT,
  segments: [
    { text: "The thing we ", suggestionId: null },
    { text: "really wanted to do", suggestionId: "s1" },
    { text: " was make the whole process ", suggestionId: null },
    { text: "a lot better", suggestionId: "s2" },
    {
      text: " for the people using it, because right now it's ",
      suggestionId: null,
    },
    { text: "kind of a mess", suggestionId: "s3" },
    { text: " and everyone just works around it.", suggestionId: null },
  ],
  suggestions: [
    {
      id: "s1",
      original: "really wanted to do",
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
      id: "s2",
      original: "a lot better",
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
      id: "s3",
      original: "kind of a mess",
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
  ],
  durationSeconds: 42,
  savedWords: ["markedly", "unwieldy", "to set out", "disarray"],
  createdAt: new Date(Date.now() - 3 * HOUR_MS).toISOString(),
};

// The 15 static bar heights (0..1) 9c draws. The bars stay decorative: speech
// recognition gives no audio to measure.
export const RECORDER_PREVIEW_LEVELS: number[] = [
  0.25, 0.54, 0.86, 0.39, 0.71, 0.21, 0.61, 0.93, 0.46, 0.32, 0.79, 0.54, 0.18,
  0.64, 0.36,
];

// Flat bars for the "waiting for the mic" state, before anything is heard.
export const FLAT_RECORDER_LEVELS: number[] = new Array<number>(15).fill(0.08);
