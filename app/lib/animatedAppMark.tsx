import { Box, Flex, Text } from "@mantine/core";
import { text } from "../theme/typography";

const MARK_SIZE = 240;
const CAPTION_GAP = 28;

interface AnimatedAppMarkProps {
  caption: string;
}

export function AnimatedAppMark({ caption }: AnimatedAppMarkProps) {
  return (
    <Flex
      align="center"
      justify="center"
      flex={1}
      mih="100vh"
      bg="var(--color-surface)">
      <Box pos="relative">
        <img
          className="app-mark"
          src="/pwa-512x512.png"
          alt=""
          width={MARK_SIZE}
          height={MARK_SIZE}
        />
        <Text
          {...text.label}
          className="app-mark-caption"
          pos="absolute"
          top="100%"
          left="50%"
          mt={CAPTION_GAP}
          style={{ whiteSpace: "nowrap" }}>
          {caption}
        </Text>
      </Box>
    </Flex>
  );
}
