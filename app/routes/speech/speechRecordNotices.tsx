import { Link } from "react-router";
import { Box, Button, Flex, Text, ThemeIcon } from "@mantine/core";
import { IconKeyboard, IconMicrophoneOff } from "@tabler/icons-react";
import { text } from "../../theme/typography";
import { ActionBar } from "../practice/actionBar";

interface SpeechRecordNoticeProps {
  icon: React.ReactNode;
  iconBackground: string;
  iconColor: string;
  title: string;
  body: string;
  action: React.ReactNode;
}

function SpeechRecordNotice({
  icon,
  iconBackground,
  iconColor,
  title,
  body,
  action,
}: SpeechRecordNoticeProps) {
  return (
    <Flex direction="column" p={16} pb={110} flex={1}>
      <Flex
        direction="column"
        flex={1}
        align="center"
        justify="center"
        gap={16}
        ta="center">
        <ThemeIcon size={58} radius={29} color={iconBackground} c={iconColor}>
          {icon}
        </ThemeIcon>
        <Box>
          <Text {...text.displaySm}>{title}</Text>
          <Text {...text.bodyXs} c="dimmed" mt={6}>
            {body}
          </Text>
        </Box>
      </Flex>

      <ActionBar>{action}</ActionBar>
    </Flex>
  );
}

const MICROPHONE_ERROR_COPY = {
  denied: {
    title: "Microphone access is off",
    body: "Allow the microphone for this site in your browser settings, then try again.",
  },
  unreachable: {
    title: "Couldn't reach the microphone",
    body: "Check that a microphone is available and you're online. Speech recognition needs a connection.",
  },
};

interface MicrophoneErrorProps {
  failure: "denied" | "unreachable";
}

export function MicrophoneError({ failure }: MicrophoneErrorProps) {
  const { title, body } = MICROPHONE_ERROR_COPY[failure];

  return (
    <SpeechRecordNotice
      icon={<IconMicrophoneOff size={26} />}
      iconBackground="var(--color-surface-error-2)"
      iconColor="var(--color-text-error-strong)"
      title={title}
      body={body}
      action={
        <Button
          component={Link}
          to="/speech"
          fullWidth
          h={50}
          radius={13}
          variant="outline"
          color="dark">
          Back to Speech
        </Button>
      }
    />
  );
}

export function RecognitionUnsupported() {
  return (
    <SpeechRecordNotice
      icon={<IconKeyboard size={26} />}
      iconBackground="var(--color-surface-warm)"
      iconColor="var(--color-text)"
      title="Recording isn't available here"
      body="This browser can't turn speech into text. Type what you'd say instead, and it's sharpened the same way."
      action={
        <Button
          component={Link}
          to="/speech/type"
          replace
          fullWidth
          h={50}
          radius={13}
          color="black">
          Type it instead
        </Button>
      }
    />
  );
}
