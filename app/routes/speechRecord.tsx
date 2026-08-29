import { useNavigate } from "react-router";
import { SpeechRecorder } from "./speech/speechRecorder";
import {
  RECORDER_PREVIEW_LEVELS,
  STANDUP_RECORDING,
} from "./speech/speechFixtures";

// Stage 1a has no recorder hook — this renders 9c's "recording" look from
// constants. Stage 1b replaces the constant props with useSpeechRecorder().
const PREVIEW_ELAPSED_SECONDS = 42;

export default function SpeechRecordRoute() {
  const navigate = useNavigate();

  return (
    <SpeechRecorder
      isSupported
      status="recording"
      elapsedSeconds={PREVIEW_ELAPSED_SECONDS}
      levels={RECORDER_PREVIEW_LEVELS}
      onStop={() => {
        // TODO(speech): stage 1b generates a real transcript and calls
        // analyzeSpeech(); for now, land on the fixture it would produce.
        void navigate(`/speech/${STANDUP_RECORDING.id}`);
      }}
      onCancel={() => void navigate("/speech")}
    />
  );
}
