import { replace, type ClientActionFunctionArgs } from "react-router";
import { notifications } from "@mantine/notifications";
import { SpeechKeepView } from "./speech/speechKeepView";
import { useSpeechReview } from "./speech/speechReviewContext";
import { keepWords, type KeepSaveFailure } from "./speech/keptWords";
import { finishSpeechReview } from "./speech/speechApi";
import type { ChosenAlternatives } from "./speech/speechTypes";

interface KeepRequest {
  words: string[];
  chosenAlternatives: ChosenAlternatives;
}

function isKeepRequest(body: unknown): body is KeepRequest {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const { words, chosenAlternatives } = body as {
    words?: unknown;
    chosenAlternatives?: unknown;
  };
  return (
    Array.isArray(words) &&
    words.every((word) => typeof word === "string") &&
    typeof chosenAlternatives === "object" &&
    chosenAlternatives !== null &&
    Object.values(chosenAlternatives).every(
      (index) => typeof index === "number",
    )
  );
}

function formatQuotedList(words: string[]): string {
  return words.map((word) => `“${word}”`).join(", ");
}

// A POST action rather than calls from the component: the layout's vocabulary
// loader refetches only after a submission, and this is what puts the kept
// words on the Words list without a reload.
export async function clientAction({
  request,
  params,
}: ClientActionFunctionArgs) {
  const id = params.id;
  if (!id) {
    throw new Response("Speech entry not found", { status: 404 });
  }

  const body: unknown = await request.json();
  if (!isKeepRequest(body)) {
    throw new Response("Expected { words, chosenAlternatives }", {
      status: 400,
    });
  }

  const { failedWords, notFoundWords } = await keepWords(body.words);

  // Shown here rather than on the keep screen: on success the action redirects
  // away, and a lookup with no meanings is not worth retrying.
  if (notFoundWords.length > 0) {
    notifications.show({
      message: `No dictionary entry for ${formatQuotedList(notFoundWords)}, so ${
        notFoundWords.length === 1 ? "it wasn’t" : "they weren’t"
      } saved.`,
    });
  }

  if (failedWords.length > 0) {
    return { reason: "words", failedWords } satisfies KeepSaveFailure;
  }

  try {
    await finishSpeechReview({
      id,
      chosenAlternatives: body.chosenAlternatives,
    });
  } catch (error) {
    console.error("Failed to finish speech review", error);
    return { reason: "finish" } satisfies KeepSaveFailure;
  }

  return replace("/");
}

export default function SpeechKeepRoute() {
  const { recording, chosenAlternatives } = useSpeechReview();
  return (
    <SpeechKeepView
      recording={recording}
      chosenAlternatives={chosenAlternatives}
    />
  );
}
