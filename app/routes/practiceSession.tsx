import { redirect } from "react-router";
import {
  firstStepPath,
  parsePracticeMode,
  useSessionStore,
} from "../store/session";
import type { Route } from "./+types/practiceSession";

// Entry point for links that arrive from outside the app (practice reminders):
// the session queue lives in memory only, so it has to be rebuilt from the URL
// before the first step renders.
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const params = new URL(request.url).searchParams;
  const words = (params.get("words") ?? "")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return redirect("/practice");
  }

  const mode = parsePracticeMode(params.get("mode"));
  useSessionStore.getState().startSession(words, mode);

  return redirect(firstStepPath({ word: words[0], mode }));
}

export default function PracticeSessionRoute() {
  return null;
}
