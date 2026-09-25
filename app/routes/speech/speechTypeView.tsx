import { Button, Stack, Text } from "@mantine/core";
import { text } from "../../theme/typography";
import { ActionBar } from "../practice/actionBar";
import { TranscriptField } from "./transcriptField";

interface SpeechTypeViewProps {
  transcript: string;
  onChangeTranscript: (value: string) => void;
  canSubmit: boolean;
  onSubmit: () => void;
}

export function SpeechTypeView({
  transcript,
  onChangeTranscript,
  canSubmit,
  onSubmit,
}: SpeechTypeViewProps) {
  return (
    <>
      <Stack gap={16} p={16} pb={110} flex={1}>
        <Text {...text.displayMd}>Paste or write</Text>

        <TranscriptField
          value={transcript}
          onChange={onChangeTranscript}
          placeholder="What do you want to sharpen?"
          shouldAutofocus
        />
      </Stack>

      <ActionBar>
        <Button
          fullWidth
          h={50}
          radius={13}
          color="black"
          disabled={!canSubmit}
          onClick={onSubmit}>
          Improve this
        </Button>
      </ActionBar>
    </>
  );
}
