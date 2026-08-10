import { useState } from "react";
import { ActionIcon, Button, Flex, Group, Stack, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router";
import { text } from "../../theme/typography";
import {
  firstStepPath,
  type PracticeMode,
  useSessionStore,
} from "../../store/session";
import { ActionBar } from "./actionBar";

interface PracticePreviewProps {
  words: { word: string; display: string }[];
  mode: PracticeMode;
}

export const PracticePreview = ({ words, mode }: PracticePreviewProps) => {
  const navigate = useNavigate();
  const startSession = useSessionStore((s) => s.startSession);
  const [isRevealed, setIsRevealed] = useState(false);

  const startPractice = () => {
    const [first] = words;
    if (first === undefined) {
      return;
    }
    startSession(
      words.map(({ word }) => word),
      mode,
    );
    void navigate(firstStepPath({ word: first.word, mode }));
  };

  if (words.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" flex={1} p={16}>
        <Text {...text.body} c="dimmed">
          No words in this session.
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" flex={1} px={24} pb={166}>
      <Flex justify="flex-start" pt={4}>
        <ActionIcon
          component={Link}
          to="/practice"
          variant="subtle"
          color="gray"
          size="md"
          aria-label="Close">
          <IconX size={22} />
        </ActionIcon>
      </Flex>

      <Text {...text.displayLg} mt={24}>
        {words.length === 1
          ? "1 word is ready"
          : `${words.length} words are ready`}
      </Text>

      <Stack
        gap={0}
        mt={20}
        opacity={isRevealed ? 1 : 0.55}
        aria-hidden={!isRevealed}
        style={{
          filter: isRevealed ? "blur(0px)" : "blur(5px)",
          transition: "filter 220ms ease, opacity 220ms ease",
          userSelect: isRevealed ? undefined : "none",
        }}>
        {words.map(({ word, display }, i) => (
          <Group
            key={word}
            gap={12}
            wrap="nowrap"
            align="baseline"
            py={11}
            style={{ borderBottom: "1px solid var(--color-border)" }}>
            <Text {...text.meta} w={14}>
              {i + 1}
            </Text>
            <Text {...text.displaySm} flex={1}>
              {display}
            </Text>
          </Group>
        ))}
      </Stack>

      <ActionBar>
        <Stack gap={8}>
          <Button
            fullWidth
            variant="filled"
            color="black"
            h={50}
            radius={13}
            onClick={startPractice}>
            Start practising
          </Button>
          {!isRevealed && (
            <Button
              fullWidth
              variant="outline"
              color="dark"
              h={50}
              radius={13}
              onClick={() => setIsRevealed(true)}>
              See the words first
            </Button>
          )}
        </Stack>
      </ActionBar>
    </Flex>
  );
};
