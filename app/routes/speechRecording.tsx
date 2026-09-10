import type { ClientLoaderFunctionArgs } from "react-router";
import axios from "axios";
import { SpeechRecordingView } from "./speech/speechRecordingView";
import { getSpeechEntry } from "./speech/speechApi";

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const id = params.id;
  if (!id) {
    throw new Response("Speech entry not found", { status: 404 });
  }

  try {
    return await getSpeechEntry(id);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Response("Speech entry not found", { status: 404 });
    }
    throw error;
  }
}

export default function SpeechRecordingRoute({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof clientLoader>>;
}) {
  return <SpeechRecordingView recording={loaderData} />;
}
