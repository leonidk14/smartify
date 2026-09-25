import { useState } from "react";
import { AnimatedAppMark } from "../lib/animatedAppMark";
import { SpeechAnalysisError } from "./speech/speechAnalysisError";
import { SpeechTypeView } from "./speech/speechTypeView";
import { isSubmittableTranscript } from "./speech/speechTextRules";
import { useSpeechAnalysis } from "./speech/useSpeechAnalysis";

export default function SpeechTypeRoute() {
  const [transcript, setTranscript] = useState("");
  const { phase, analyze, returnToEditing } = useSpeechAnalysis();

  const canSubmit = isSubmittableTranscript(transcript);

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    void analyze({ transcript, durationSeconds: null });
  };

  if (phase === "analyzing") {
    return <AnimatedAppMark caption="Reading what you said…" />;
  }

  if (phase === "error") {
    return (
      <SpeechAnalysisError onRetry={handleSubmit} onBack={returnToEditing} />
    );
  }

  return (
    <SpeechTypeView
      transcript={transcript}
      onChangeTranscript={setTranscript}
      canSubmit={canSubmit}
      onSubmit={handleSubmit}
    />
  );
}
