import { Flex, Text } from "@mantine/core";
import { text } from "../theme/typography";

const MARK_SIZE = 128;

export function AppSplash() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap={28}
      flex={1}
      mih="100vh"
      bg="var(--color-surface)">
      <img
        className="app-splash-mark"
        src="/pwa-512x512.png"
        alt=""
        width={MARK_SIZE}
        height={MARK_SIZE}
      />
      <Text {...text.label} className="app-splash-caption">
        Loading the vocabulary
      </Text>
    </Flex>
  );
}
