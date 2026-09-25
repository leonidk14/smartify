import { SpeechList } from "./speech/speechList";
import { listSpeechEntries } from "./speech/speechApi";

export async function clientLoader() {
  return listSpeechEntries();
}

export default function SpeechRoute({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof clientLoader>>;
}) {
  return <SpeechList recordings={loaderData} />;
}
