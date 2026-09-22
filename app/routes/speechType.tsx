import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useNavigation } from "react-router";
import axios from "axios";
import { AnimatedAppMark } from "../lib/animatedAppMark";
import { SpeechAnalysisError } from "./speech/speechAnalysisError";
import { SpeechTypeView } from "./speech/speechTypeView";
import { analyzeSpeech, saveSpeechEntry } from "./speech/speechApi";
import {
  countCharacters,
  countWords,
  deriveTitle,
} from "./speech/speechTextRules";
import { MAX_TRANSCRIPT_CHARACTERS } from "./speech/speechConstants";

type Phase = "typing" | "analyzing" | "error";

export default function SpeechTypeRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigation = useNavigation();
  const [transcript, setTranscript] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const controllerRef = useRef<AbortController | null>(null);

  const isLeaving =
    navigation.location !== undefined &&
    navigation.location.pathname !== location.pathname;

  useEffect(() => {
    if (isLeaving) {
      controllerRef.current?.abort();
    }
  }, [isLeaving]);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  const characterCount = countCharacters(transcript);
  const canSubmit =
    transcript.trim().length > 0 && characterCount <= MAX_TRANSCRIPT_CHARACTERS;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setPhase("analyzing");
    const controller = new AbortController();
    controllerRef.current = controller;

    const trimmed = transcript.trim();
    try {
      const { segments, suggestions } = await analyzeSpeech(
        trimmed,
        controller.signal,
      );
      const entry = await saveSpeechEntry(
        {
          title: deriveTitle(trimmed),
          transcript: trimmed,
          wordCount: countWords(trimmed),
          durationSeconds: null,
          segments,
          suggestions,
        },
        controller.signal,
      );

      await navigate(`/speech/${entry.id}`);
    } catch (error) {
      if (axios.isCancel(error)) {
        return;
      }
      console.error("Failed to analyze speech entry", error);
      setPhase("error");
    }
  };

  if (phase === "analyzing") {
    return <AnimatedAppMark caption="Reading what you said…" />;
  }

  if (phase === "error") {
    return (
      <SpeechAnalysisError
        onRetry={() => void handleSubmit()}
        onBack={() => setPhase("typing")}
      />
    );
  }

  return (
    <SpeechTypeView
      transcript={transcript}
      onChangeTranscript={setTranscript}
      characterCount={characterCount}
      canSubmit={canSubmit}
      onSubmit={() => void handleSubmit()}
    />
  );
}
