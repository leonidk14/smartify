import { Box, Button, Flex, Text } from "@mantine/core";
import { text } from "../../theme/typography";
import { formatDuration } from "./speechFormat";
import { LevelBars } from "./levelBars";
import {
  FLAT_RECORDER_LEVELS,
  RECORDER_PREVIEW_LEVELS,
} from "./speechFixtures";
import type { ListeningStatus } from "./useSpeechRecorder";

interface SpeechRecorderProps {
  status: ListeningStatus;
  elapsedSeconds: number;
  onStop: () => void;
}

const STATUS_LABEL: Record<ListeningStatus, string> = {
  starting: "WAITING FOR THE MIC",
  recording: "RECORDING",
  finishing: "READING IT BACK",
};

export function SpeechRecorder({
  status,
  elapsedSeconds,
  onStop,
}: SpeechRecorderProps) {
  return (
    <Flex direction="column" p={16} gap={0} flex={1}>
      <Flex
        direction="column"
        flex={1}
        align="center"
        justify="center"
        gap={26}>
        <Text
          ff="var(--font-family-mono)"
          fz={46}
          fw={400}
          style={{ letterSpacing: "-1px" }}>
          {formatDuration(elapsedSeconds)}
        </Text>
        <LevelBars
          levels={
            status === "recording"
              ? RECORDER_PREVIEW_LEVELS
              : FLAT_RECORDER_LEVELS
          }
        />
        <Text {...text.meta} style={{ letterSpacing: ".6px" }}>
          {STATUS_LABEL[status]}
        </Text>
      </Flex>
      <Box pb={26}>
        <Button
          fullWidth
          h={52}
          radius={14}
          color="black"
          disabled={status === "starting"}
          loading={status === "finishing"}
          onClick={onStop}>
          Stop and read it back
        </Button>
      </Box>
    </Flex>
  );
}
