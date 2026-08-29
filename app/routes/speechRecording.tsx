import type { ClientLoaderFunctionArgs } from "react-router";
import { SpeechRecordingView } from "./speech/speechRecordingView";
import { SPEECH_FIXTURES } from "./speech/speechFixtures";

export function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const recording = SPEECH_FIXTURES.find((r) => r.id === params.id);
  if (!recording) {
    throw new Response("Recording not found", { status: 404 });
  }
  return recording;
}

export default function SpeechRecordingRoute({
  loaderData,
}: {
  loaderData: ReturnType<typeof clientLoader>;
}) {
  return <SpeechRecordingView recording={loaderData} />;
}
