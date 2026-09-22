import { useOutletContext } from "react-router";
import type { SpeechEntry } from "./speechApi";
import type { ChosenAlternatives } from "./speechTypes";

export interface SpeechReviewContext {
  recording: SpeechEntry;
  chosenAlternatives: ChosenAlternatives;
}

export function useSpeechReview(): SpeechReviewContext {
  return useOutletContext<SpeechReviewContext>();
}
