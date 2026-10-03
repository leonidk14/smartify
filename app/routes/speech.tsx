import { SpeechList } from "./speech/speechList";
import { listSpeechEntries } from "./speech/speechApi";

export function clientLoader() {
  return { recordings: listSpeechEntries() };
}

export default function SpeechRoute({
  loaderData,
}: {
  loaderData: ReturnType<typeof clientLoader>;
}) {
  return <SpeechList recordings={loaderData.recordings} />;
}
