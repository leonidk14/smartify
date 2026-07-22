import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Button,
  Flex,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { monoLabel } from "../wordSearch/typography";
import type { VocabularyEntry } from "../wordSearch/vocabulary";
import {
  firstStepPath,
  type PracticeMode,
  useSessionStore,
} from "../../store/session";

interface PracticeSelectProps {
  words: [string, VocabularyEntry][];
  mode: PracticeMode;
}

const RANDOM_COUNT = 5;

const shuffle = <T,>(items: T[]): T[] =>
  [...items].sort(() => Math.random() - 0.5);

export const PracticeSelect = ({ words, mode }: PracticeSelectProps) => {
  const navigate = useNavigate();
  const startSession = useSessionStore((s) => s.startSession);

  const [selected, setSelected] = useState<string[]>([]);

  const allWords = words.map(([w]) => w);
  const markedWords = words
    .filter(([, entry]) => entry.shouldPracticeLater)
    .map(([w]) => w);

  const toggle = (word: string) =>
    setSelected((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word],
    );

  const selectRandom = () =>
    setSelected(
      shuffle(allWords).slice(0, Math.min(RANDOM_COUNT, allWords.length)),
    );

  const startPractice = () => {
    if (selected.length === 0) {
      return;
    }
    const ordered = allWords.filter((w) => selected.includes(w));
    startSession(ordered, mode);
    navigate(firstStepPath({ word: ordered[0], mode }));
  };

  if (words.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" flex={1} p={16}>
        <Text size="lg" c="dimmed">
          No words saved yet. Look up words to build your vocabulary.
        </Text>
      </Flex>
    );
  }

  const quickButton = (
    label: string,
    onClick: () => void,
    disabled = false,
  ) => (
    <Button
      variant="default"
      radius={10}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      flex={1}>
      {label}
    </Button>
  );

  return (
    <Flex direction="column" px={20} pb={96} gap={16}>
      <Group gap={8} wrap="nowrap">
        {quickButton(
          `Marked`,
          () => setSelected(markedWords),
          markedWords.length === 0,
        )}
        {quickButton(`All`, () => setSelected(allWords))}
        {quickButton("Random", selectRandom)}
      </Group>

      <Box>
        <Text {...monoLabel} mb={4}>
          {selected.length} selected
        </Text>
        <Stack gap={0}>
          {words.map(([word, entry]) => {
            const isSelected = selected.includes(word);
            return (
              <Group
                key={word}
                gap={12}
                wrap="nowrap"
                py={12}
                onClick={() => toggle(word)}
                style={{
                  borderBottom: "1px solid rgba(0,0,0,.07)",
                  cursor: "pointer",
                  userSelect: "none",
                }}>
                <ThemeIcon
                  size={22}
                  radius={7}
                  variant={isSelected ? "filled" : "outline"}
                  color={isSelected ? "dark" : "gray"}>
                  {isSelected ? <IconCheck size={13} /> : <span />}
                </ThemeIcon>
                <Text className="serif" size="lg">
                  {(entry.display?.toLowerCase() ?? word).replace(/^./, (c) =>
                    c.toUpperCase(),
                  )}
                </Text>
              </Group>
            );
          })}
        </Stack>
      </Box>

      <Box
        pos="fixed"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        px={20}
        pt={12}
        pb={16}
        style={{ borderTop: "1px solid rgba(0,0,0,.09)" }}>
        <Button
          fullWidth
          size="lg"
          radius={13}
          color="black"
          onClick={startPractice}
          disabled={selected.length === 0}>
          Practice {selected.length} {selected.length === 1 ? "word" : "words"}
        </Button>
      </Box>
    </Flex>
  );
};
