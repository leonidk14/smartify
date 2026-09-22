import { useState } from "react";
import { AnimatedAppMark } from "../lib/animatedAppMark";
import { SpeechAnalysisError } from "./speech/speechAnalysisError";
import { SpeechCheckView } from "./speech/speechCheckView";
import { SpeechRecorder } from "./speech/speechRecorder";
import { SpeechRecordHeader } from "./speech/speechRecordHeader";
import {
  MicrophoneError,
  RecognitionUnsupported,
} from "./speech/speechRecordNotices";
import { isSubmittableTranscript } from "./speech/speechTextRules";
import { useSpeechAnalysis } from "./speech/useSpeechAnalysis";
import {
  IS_SPEECH_RECOGNITION_SUPPORTED,
  isListening,
  useSpeechRecorder,
} from "./speech/useSpeechRecorder";

export default function SpeechRecordRoute() {
  const [takeNumber, setTakeNumber] = useState(0);

  if (!IS_SPEECH_RECOGNITION_SUPPORTED) {
    return (
      <>
        <SpeechRecordHeader />
        <RecognitionUnsupported />
      </>
    );
  }

  // A new key remounts the take, which is what "Record again" means: an empty
  // transcript, a clock back at zero, and a fresh recognition session.
  return (
    <SpeechTake
      key={takeNumber}
      onRecordAgain={() => setTakeNumber((current) => current + 1)}
    />
  );
}

interface SpeechTakeProps {
  onRecordAgain: () => void;
}

function SpeechTake({ onRecordAgain }: SpeechTakeProps) {
  const { status, transcript, elapsedSeconds, stop, editTranscript } =
    useSpeechRecorder();
  const { phase, analyze, returnToEditing } = useSpeechAnalysis();

  const canSubmit = isSubmittableTranscript(transcript);

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    void analyze({ transcript, durationSeconds: elapsedSeconds });
  };

  if (status === "denied" || status === "unreachable") {
    return (
      <>
        <SpeechRecordHeader />
        <MicrophoneError failure={status} />
      </>
    );
  }

  if (isListening(status)) {
    return (
      <>
        <SpeechRecordHeader isMaxShown />
        <SpeechRecorder
          status={status}
          elapsedSeconds={elapsedSeconds}
          onStop={stop}
        />
      </>
    );
  }

  if (phase === "analyzing") {
    return (
      <>
        <SpeechRecordHeader />
        <AnimatedAppMark caption="Reading what you said…" />
      </>
    );
  }

  if (phase === "error") {
    return (
      <>
        <SpeechRecordHeader />
        <SpeechAnalysisError onRetry={handleSubmit} onBack={returnToEditing} />
      </>
    );
  }

  return (
    <>
      <SpeechRecordHeader />
      <SpeechCheckView
        transcript={transcript}
        durationSeconds={elapsedSeconds}
        onChangeTranscript={editTranscript}
        canSubmit={canSubmit}
        onSubmit={handleSubmit}
        onRecordAgain={onRecordAgain}
      />
    </>
  );
}
