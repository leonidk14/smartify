import { Box, Button, Center, Flex, Group, Text } from "@mantine/core";
import { IconCloudOff } from "@tabler/icons-react";
import { text } from "../../theme/typography";
import { ActionBar } from "../practice/actionBar";

interface SpeechAnalysisErrorProps {
  onRetry: () => void;
  onBack: () => void;
}

export function SpeechAnalysisError({
  onRetry,
  onBack,
}: SpeechAnalysisErrorProps) {
  return (
    <Flex direction="column" p={16} pb={110} flex={1}>
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
          <IconCloudOff
            size={26}
            style={{ color: "var(--color-text-error-strong)" }}
          />
        </Center>
        <Box>
          <Text {...text.displaySm}>Couldn&apos;t analyze that</Text>
          <Text {...text.bodyXs} c="dimmed" mt={6}>
            Check your connection and try again — your text is still here.
          </Text>
        </Box>
      </Flex>

      <ActionBar>
        <Group gap={10} wrap="nowrap">
          <Button
            variant="outline"
            color="dark"
            h={50}
            radius={13}
            onClick={onBack}>
            Back
          </Button>
          <Button
            variant="filled"
            color="black"
            h={50}
            radius={13}
            flex={1}
            onClick={onRetry}>
            Try again
          </Button>
        </Group>
      </ActionBar>
    </Flex>
  );
}
