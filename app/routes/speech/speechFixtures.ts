import type { SpeechRecording } from "./speechTypes";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

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

const INTERVIEW_TRANSCRIPT =
  "I spent the last two years leading the migration, working closely with the platform team, and I'd love to bring that experience here.";

export const INTERVIEW_RECORDING: SpeechRecording = {
  id: "interview-answer",
  title: "Interview answer",
  transcript: INTERVIEW_TRANSCRIPT,
  // Nothing flagged — a well-spoken transcript renders as one plain segment,
  // covering the "9d with no suggestions" state.
  segments: [{ text: INTERVIEW_TRANSCRIPT, suggestionId: null }],
  suggestions: [],
  durationSeconds: 76,
  savedWords: [],
  createdAt: new Date(Date.now() - 4 * DAY_MS).toISOString(),
};

const TOAST_TRANSCRIPT =
  "When I first met the two of them I thought this was kind of a long shot, but honestly they're really great together and I couldn't be happier for them.";

export const TOAST_RECORDING: SpeechRecording = {
  id: "toast-draft",
  title: "Toast draft",
  transcript: TOAST_TRANSCRIPT,
  segments: [
    {
      text: "When I first met the two of them I thought this was ",
      suggestionId: null,
    },
    { text: "kind of a long shot", suggestionId: "t1" },
    { text: ", but honestly they're ", suggestionId: null },
    { text: "really great together", suggestionId: "t2" },
    { text: " and I ", suggestionId: null },
    { text: "couldn't be happier", suggestionId: "t3" },
    { text: " for them.", suggestionId: null },
  ],
  suggestions: [
    {
      id: "t1",
      original: "kind of a long shot",
      alternatives: [
        {
          phrase: "unlikely to work",
          register: "neutral",
          inSentence:
            "When I first met the two of them I thought this was unlikely to work…",
          vocabularyWord: "unlikely",
        },
        {
          phrase: "an improbable match",
          register: "formal",
          inSentence:
            "When I first met the two of them I thought this was an improbable match…",
          vocabularyWord: "improbable",
        },
        {
          phrase: "a real stretch",
          register: "plain",
          inSentence:
            "When I first met the two of them I thought this was a real stretch…",
          vocabularyWord: "stretch",
        },
      ],
    },
    {
      id: "t2",
      original: "really great together",
      alternatives: [
        {
          phrase: "wonderfully suited",
          register: "neutral",
          inSentence: "…but honestly they're wonderfully suited",
          vocabularyWord: "suited",
        },
        {
          phrase: "remarkably well matched",
          register: "formal",
          inSentence: "…but honestly they're remarkably well matched",
          vocabularyWord: "matched",
        },
        {
          phrase: "a great fit",
          register: "plain",
          inSentence: "…but honestly they're a great fit",
          vocabularyWord: "fit",
        },
      ],
    },
    {
      id: "t3",
      original: "couldn't be happier",
      alternatives: [
        {
          phrase: "delighted",
          register: "neutral",
          inSentence: "…and I am delighted for them.",
          vocabularyWord: "delighted",
        },
        {
          phrase: "utterly elated",
          register: "formal",
          inSentence: "…and I am utterly elated for them.",
          vocabularyWord: "elated",
        },
        {
          phrase: "thrilled",
          register: "plain",
          inSentence: "…and I'm thrilled for them.",
          vocabularyWord: "thrilled",
        },
      ],
    },
  ],
  durationSeconds: 55,
  savedWords: [
    "unlikely",
    "improbable",
    "suited",
    "matched",
    "delighted",
    "elated",
  ],
  createdAt: new Date(Date.now() - 6 * DAY_MS).toISOString(),
};

// Newest first, matching how 9b lists recordings.
export const SPEECH_FIXTURES: SpeechRecording[] = [
  STANDUP_RECORDING,
  INTERVIEW_RECORDING,
  TOAST_RECORDING,
];

// The 15 static bar heights (0..1) 9c draws — a stand-in for live amplitudes
// until stage 1b feeds this from the level meter.
export const RECORDER_PREVIEW_LEVELS: number[] = [
  0.25, 0.54, 0.86, 0.39, 0.71, 0.21, 0.61, 0.93, 0.46, 0.32, 0.79, 0.54, 0.18,
  0.64, 0.36,
];

// Flat bars for the "waiting for the mic" state, before anything is heard.
export const FLAT_RECORDER_LEVELS: number[] = new Array<number>(15).fill(0.08);
