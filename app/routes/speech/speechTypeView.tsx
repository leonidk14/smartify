import { Button, Stack, Text, Textarea } from "@mantine/core";
import { text, textCss } from "../../theme/typography";
import { ActionBar } from "../practice/actionBar";
import { MAX_TRANSCRIPT_CHARACTERS } from "./speechConstants";

interface SpeechTypeViewProps {
  transcript: string;
  onChangeTranscript: (value: string) => void;
  characterCount: number;
  canSubmit: boolean;
  onSubmit: () => void;
}

export function SpeechTypeView({
  transcript,
  onChangeTranscript,
  characterCount,
  canSubmit,
  onSubmit,
}: SpeechTypeViewProps) {
  const isOverLimit = characterCount > MAX_TRANSCRIPT_CHARACTERS;

  return (
    <>
      <Stack gap={16} p={16} pb={110} flex={1}>
        <Text {...text.displayMd}>Paste or write</Text>

        <Textarea
          variant="unstyled"
          placeholder="What do you want to sharpen?"
          autosize
          minRows={8}
          bd="1.5px dashed rgba(0,0,0,.22)"
          bdrs={14}
          styles={{ input: { padding: "14px 15px", ...textCss.body } }}
          value={transcript}
          onChange={(event) => onChangeTranscript(event.currentTarget.value)}
          autoComplete="off"
          data-autofocus
        />

        <Text {...text.meta} ta="right" c={isOverLimit ? "red" : "dimmed"}>
          {characterCount} / {MAX_TRANSCRIPT_CHARACTERS}
        </Text>
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
