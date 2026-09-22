import { SpeechKeepView } from "./speech/speechKeepView";
import { useSpeechReview } from "./speech/speechReviewContext";

export default function SpeechKeepRoute() {
  const { recording, chosenAlternatives } = useSpeechReview();
  return (
    <SpeechKeepView
      recording={recording}
      chosenAlternatives={chosenAlternatives}
    />
  );
}
