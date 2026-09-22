import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_DURATION_SECONDS } from "./speechConstants";

export type ListeningStatus = "starting" | "recording" | "finishing";
type FailureStatus = "denied" | "unreachable";
export type RecorderStatus = ListeningStatus | "finished" | FailureStatus;

interface ListeningCallbacks {
  onStart: () => void;
  onWords: (words: string) => void;
  onFinish: () => void;
  onFailure: (failure: FailureStatus) => void;
}

interface ListeningSession {
  stop: () => void;
  dispose: () => void;
}

const TICK_MS = 250;
const STOP_GRACE_MS = 2000;

const IGNORED_ERRORS: SpeechRecognitionErrorCode[] = ["no-speech", "aborted"];
const DENIED_ERRORS: SpeechRecognitionErrorCode[] = [
  "not-allowed",
  "service-not-allowed",
];

const SpeechRecognitionApi =
  typeof SpeechRecognition !== "undefined"
    ? SpeechRecognition
    : typeof webkitSpeechRecognition !== "undefined"
      ? webkitSpeechRecognition
      : undefined;

export const IS_SPEECH_RECOGNITION_SUPPORTED =
  SpeechRecognitionApi !== undefined;

export function isListening(status: RecorderStatus): status is ListeningStatus {
  return (
    status === "starting" || status === "recording" || status === "finishing"
  );
}

function listen(
  Api: typeof SpeechRecognition,
  callbacks: ListeningCallbacks,
): ListeningSession {
  const recognition = new Api();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";
  recognition.maxAlternatives = 1;

  let isStopping = false;
  let isOver = false;
  let stopGraceTimeoutId: number | undefined;

  const finish = () => {
    if (isOver) {
      return;
    }
    isOver = true;
    window.clearTimeout(stopGraceTimeoutId);
    callbacks.onFinish();
  };

  const fail = (failure: FailureStatus) => {
    if (isOver) {
      return;
    }
    isOver = true;
    window.clearTimeout(stopGraceTimeoutId);
    recognition.abort();
    callbacks.onFailure(failure);
  };

  const start = () => {
    try {
      recognition.start();
    } catch {
      fail("unreachable");
    }
  };

  recognition.onstart = () => {
    if (!isOver) {
      callbacks.onStart();
    }
  };

  recognition.onresult = (event) => {
    if (isOver) {
      return;
    }
    const words = Array.from(event.results)
      .slice(event.resultIndex)
      .filter((result) => result.isFinal)
      .map((result) => result[0]?.transcript.trim() ?? "")
      .filter((piece) => piece !== "")
      .join(" ");
    if (words !== "") {
      callbacks.onWords(words);
    }
  };

  recognition.onerror = (event) => {
    if (IGNORED_ERRORS.includes(event.error)) {
      return;
    }
    fail(DENIED_ERRORS.includes(event.error) ? "denied" : "unreachable");
  };

  recognition.onend = () => {
    if (isStopping) {
      finish();
    } else if (!isOver) {
      start();
    }
  };

  start();

  return {
    // stop(), unlike abort(), still delivers the words recognised so far.
    stop: () => {
      if (isStopping || isOver) {
        return;
      }
      isStopping = true;
      recognition.stop();
      stopGraceTimeoutId = window.setTimeout(() => {
        recognition.abort();
        finish();
      }, STOP_GRACE_MS);
    },
    dispose: () => {
      isOver = true;
      window.clearTimeout(stopGraceTimeoutId);
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    },
  };
}

export function useSpeechRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("starting");
  const [transcript, setTranscript] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const sessionRef = useRef<ListeningSession | null>(null);

  useEffect(() => {
    if (SpeechRecognitionApi === undefined) {
      return;
    }
    const session = listen(SpeechRecognitionApi, {
      onStart: () =>
        setStatus((current) =>
          current === "starting" ? "recording" : current,
        ),
      onWords: (words) =>
        setTranscript((current) =>
          current === "" ? words : `${current} ${words}`,
        ),
      onFinish: () => setStatus("finished"),
      onFailure: (failure) => setStatus(failure),
    });
    sessionRef.current = session;
    return () => {
      sessionRef.current = null;
      session.dispose();
    };
  }, []);

  const stop = useCallback(() => {
    setStatus((current) => (current === "recording" ? "finishing" : current));
    sessionRef.current?.stop();
  }, []);

  const isRecording = status === "recording";

  useEffect(() => {
    if (!isRecording) {
      return;
    }
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const elapsed = Math.min(
        MAX_DURATION_SECONDS,
        Math.floor((Date.now() - startedAt) / 1000),
      );
      setElapsedSeconds(elapsed);
      if (elapsed >= MAX_DURATION_SECONDS) {
        stop();
      }
    }, TICK_MS);
    return () => window.clearInterval(intervalId);
  }, [isRecording, stop]);

  return {
    status,
    transcript,
    elapsedSeconds,
    stop,
    editTranscript: setTranscript,
  };
}
