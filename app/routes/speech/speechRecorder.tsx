import { Box, Button, Center, Flex, Text, Textarea } from "@mantine/core";
import { IconMicrophoneOff, IconRefresh } from "@tabler/icons-react";
import { text, textCss } from "../../theme/typography";
import { formatDuration } from "./speechFormat";
import { LevelBars } from "./levelBars";

type RecorderStatus = "awaitingPermission" | "recording" | "error";

interface SpeechRecorderProps {
  isSupported: boolean;
  status: RecorderStatus;
  elapsedSeconds: number;
  levels: number[];
  errorMessage?: string;
  typedValue?: string;
  onTypedValueChange?: (value: string) => void;
  onStop: () => void;
  onCancel: () => void;
}

const STATUS_LABEL: Record<RecorderStatus, string> = {
  awaitingPermission: "WAITING FOR THE MIC",
  recording: "RECORDING",
  error: "",
};

export function SpeechRecorder({
  isSupported,
  status,
  elapsedSeconds,
  levels,
  errorMessage,
  typedValue = "",
  onTypedValueChange,
  onStop,
  onCancel,
}: SpeechRecorderProps) {
  if (!isSupported) {
    return (
      <Flex direction="column" p={16} gap={20} flex={1}>
        <Flex direction="column" flex={1} gap={16} justify="center">
          <Text {...text.displaySm}>Type what you&apos;d say</Text>
          <Text {...text.bodyXs} c="dimmed">
            Speech recognition isn&apos;t available here — type it instead and
            we&apos;ll analyze the wording the same way.
          </Text>
          <Textarea
            bd="1.5px dashed rgba(0,0,0,.22)"
            bdrs={14}
            styles={{ input: { padding: "14px 15px", ...textCss.body } }}
            variant="unstyled"
            placeholder="Say something, then make it sharper…"
            autosize
            minRows={5}
            value={typedValue}
            onChange={(event) =>
              onTypedValueChange?.(event.currentTarget.value)
            }
            data-autofocus
          />
        </Flex>
        <Button
          fullWidth
          h={52}
          radius={14}
          color="black"
          disabled={!typedValue.trim()}
          onClick={onStop}>
          Continue
        </Button>
      </Flex>
    );
  }

  if (status === "error") {
    return (
      <Flex direction="column" p={16} gap={20} flex={1}>
        <Flex
          direction="column"
          flex={1}
          align="center"
          justify="center"
          gap={16}
          ta="center">
          <Center
            w={58}
            h={58}
            bg="var(--color-surface-error-2)"
            style={{ borderRadius: "50%" }}>
            <IconMicrophoneOff
              size={26}
              style={{ color: "var(--color-text-error-strong)" }}
            />
          </Center>
          <Box>
            <Text {...text.displaySm}>Couldn&apos;t reach the microphone</Text>
            <Text {...text.bodyXs} c="dimmed" mt={6}>
              {errorMessage ??
                "Check the app has microphone permission and try again."}
            </Text>
          </Box>
        </Flex>
        <Button
          fullWidth
          h={52}
          radius={14}
          variant="outline"
          color="dark"
          leftSection={<IconRefresh size={16} />}
          onClick={onCancel}>
          Back to Speech
        </Button>
      </Flex>
    );
  }

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
        <LevelBars levels={levels} />
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
          disabled={status !== "recording"}
          onClick={onStop}>
          Stop and analyze it
        </Button>
      </Box>
    </Flex>
  );
}
