import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { SpeechTypeView } from "./speech/speechTypeView";
import { saveSpeechEntry } from "./speech/speechApi";
import {
  countCharacters,
  countWords,
  deriveTitle,
} from "./speech/speechTextRules";
import { MAX_TRANSCRIPT_CHARACTERS } from "./speech/speechConstants";

export default function SpeechTypeRoute() {
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const characterCount = countCharacters(transcript);
  const canSubmit =
    transcript.trim().length > 0 && characterCount <= MAX_TRANSCRIPT_CHARACTERS;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    const trimmed = transcript.trim();
    try {
      const entry = await saveSpeechEntry({
        title: deriveTitle(trimmed),
        transcript: trimmed,
        wordCount: countWords(trimmed),
        durationSeconds: null,
        segments: [{ text: trimmed, suggestionId: null }],
        suggestions: [],
      });
      await navigate(`/speech/${entry.id}`);
    } catch (error) {
      console.error("Failed to save speech entry", error);
      const message =
        axios.isAxiosError(error) && error.response?.status === 401
          ? "Sign in to save this."
          : "Couldn't save that. Try again.";
      setErrorMessage(message);
      setIsSaving(false);
    }
  };

  return (
    <SpeechTypeView
      transcript={transcript}
      onChangeTranscript={setTranscript}
      characterCount={characterCount}
      canSubmit={canSubmit}
      isSaving={isSaving}
      errorMessage={errorMessage}
      onSubmit={() => void handleSubmit()}
    />
  );
}
