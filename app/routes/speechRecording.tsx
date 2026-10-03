import { Suspense } from "react";
import {
  Await,
  useAsyncError,
  type ClientLoaderFunctionArgs,
} from "react-router";
import axios from "axios";
import { Center, Text } from "@mantine/core";
import { AnimatedAppMark } from "../lib/animatedAppMark";
import { text } from "../theme/typography";
import { SpeechRecordingView } from "./speech/speechRecordingView";
import { getSpeechEntry } from "./speech/speechApi";

export function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const id = params.id;
  if (!id) {
    throw new Response("Speech entry not found", { status: 404 });
  }

  return { id, recording: getSpeechEntry(id) };
}

function SpeechRecordingLoadError() {
  const error = useAsyncError();
  const isNotFound =
    axios.isAxiosError(error) && error.response?.status === 404;

  return (
    <Center flex={1} p={20}>
      <Text {...text.bodyXs} c="dimmed" ta="center">
        {isNotFound
          ? "This recording could not be found."
          : "Couldn’t load this recording — check your connection."}
      </Text>
    </Center>
  );
}

export default function SpeechRecordingRoute({
  loaderData,
}: {
  loaderData: ReturnType<typeof clientLoader>;
}) {
  return (
    <Suspense
      key={loaderData.id}
      fallback={<AnimatedAppMark caption="Loading your recording…" />}>
      <Await
        resolve={loaderData.recording}
        errorElement={<SpeechRecordingLoadError />}>
        {(recording) => <SpeechRecordingView recording={recording} />}
      </Await>
    </Suspense>
  );
}
