import { Box, Button, Group, Stack, Text } from "@mantine/core";
import { IconMicrophone } from "@tabler/icons-react";
import { text } from "../../theme/typography";
import { ActionBar } from "../practice/actionBar";
import { formatDuration } from "./speechFormat";
import { TranscriptField } from "./transcriptField";

interface SpeechCheckViewProps {
  transcript: string;
  durationSeconds: number;
  onChangeTranscript: (value: string) => void;
  canSubmit: boolean;
  onSubmit: () => void;
  onRecordAgain: () => void;
}

export function SpeechCheckView({
  transcript,
  durationSeconds,
  onChangeTranscript,
  canSubmit,
  onSubmit,
  onRecordAgain,
}: SpeechCheckViewProps) {
  return (
    <>
      <Stack gap={16} p={16} pb={110} flex={1}>
        <Box>
          <Text {...text.label}>
            WHAT WE HEARD · {formatDuration(durationSeconds)}
          </Text>
          <Text {...text.bodyXs} c="dimmed" mt={6}>
            Fix anything we misheard before it&apos;s sharpened.
          </Text>
        </Box>

        <TranscriptField
          value={transcript}
          onChange={onChangeTranscript}
          placeholder="We didn't catch anything. Record again, or write it here."
        />
      </Stack>

      <ActionBar>
        <Group gap={10} wrap="nowrap">
          <Button
            variant="outline"
            color="dark"
            h={50}
            radius={13}
            leftSection={<IconMicrophone size={16} />}
            onClick={onRecordAgain}>
            Record again
          </Button>
          <Button
            variant="filled"
            color="black"
            h={50}
            radius={13}
            flex={1}
            disabled={!canSubmit}
            onClick={onSubmit}>
            Improve this
          </Button>
        </Group>
      </ActionBar>
    </>
  );
}
