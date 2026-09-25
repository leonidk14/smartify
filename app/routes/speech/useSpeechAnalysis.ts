import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useNavigation } from "react-router";
import axios from "axios";
import { analyzeSpeech, saveSpeechEntry } from "./speechApi";
import { countWords, deriveTitle } from "./speechTextRules";

type AnalysisPhase = "editing" | "analyzing" | "error";

interface Draft {
  transcript: string;
  durationSeconds: number | null;
}

export function useSpeechAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigation = useNavigation();
  const [phase, setPhase] = useState<AnalysisPhase>("editing");
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

  const analyze = async ({ transcript, durationSeconds }: Draft) => {
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
          durationSeconds,
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

  return {
    phase,
    analyze,
    returnToEditing: () => setPhase("editing"),
  };
}
