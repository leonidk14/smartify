import { SpeechList } from "./speech/speechList";
import { SPEECH_FIXTURES } from "./speech/speechFixtures";

export function clientLoader() {
  return SPEECH_FIXTURES;
}

export default function SpeechRoute({
  loaderData,
}: {
  loaderData: ReturnType<typeof clientLoader>;
}) {
  return <SpeechList recordings={loaderData} />;
}
