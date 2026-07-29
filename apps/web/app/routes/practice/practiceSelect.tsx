import { useCallback, useMemo, useState } from "react";
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
import { text } from "../../theme/typography";
import type { VocabularyEntry } from "../wordSearch/vocabulary";
import {
  firstStepPath,
  type PracticeMode,
  useSessionStore,
} from "../../store/session";

export type PreselectKind = "marked" | "all" | "random";

interface PracticeSelectProps {
  words: [string, VocabularyEntry][];
  mode: PracticeMode;
  preselect: PreselectKind | null;
}

const RANDOM_COUNT = 5;

const QUICK_OPTIONS: { kind: PreselectKind; label: string }[] = [
  { kind: "marked", label: "Marked" },
  { kind: "all", label: "All" },
  { kind: "random", label: "Random" },
];

const shuffle = <T,>(items: T[]): T[] =>
  [...items].sort(() => Math.random() - 0.5);

export function parsePreselect(value: string | null): PreselectKind | null {
  return value === "marked" || value === "all" || value === "random"
    ? value
    : null;
}

export const PracticeSelect = ({
  words,
  mode,
  preselect,
}: PracticeSelectProps) => {
  const navigate = useNavigate();
  const startSession = useSessionStore((s) => s.startSession);

  const allWords = useMemo(() => words.map(([w]) => w), [words]);
  const markedWords = useMemo(
    () =>
      words.filter(([, entry]) => entry.shouldPracticeLater).map(([w]) => w),
    [words],
  );

  const wordsForPreselect = (kind: PreselectKind): string[] => {
    if (kind === "marked") {
      return markedWords;
    }
    if (kind === "all") {
      return allWords;
    }
    return shuffle(allWords).slice(0, Math.min(RANDOM_COUNT, allWords.length));
  };

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(preselect ? wordsForPreselect(preselect) : []),
  );

  const toggle = (word: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
      }
      return next;
    });

  const startPractice = () => {
    if (selected.size === 0) {
      return;
    }
    const ordered = allWords.filter((w) => selected.has(w));
    startSession(ordered, mode);
    navigate(firstStepPath({ word: ordered[0], mode }));
  };

  if (words.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" flex={1} p={16}>
        <Text {...text.body} c="dimmed">
          No words saved yet. Look up words to build your vocabulary.
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" px={20} pb={96} gap={16}>
      <Group gap={8} wrap="nowrap">
        {QUICK_OPTIONS.map(({ kind, label }) => (
          <Button
            key={kind}
            variant="default"
            radius={10}
            size="sm"
            onClick={() => setSelected(new Set(wordsForPreselect(kind)))}
            disabled={kind === "marked" && markedWords.length === 0}
            flex={1}>
            {label}
          </Button>
        ))}
      </Group>

      <Box>
        <Text {...text.label} mb={4}>
          {selected.size} selected
        </Text>
        <Stack gap={0}>
          {words.map(([word, entry]) => {
            const isSelected = selected.has(word);
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
                <Text {...text.displaySm}>
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
        bg="var(--color-surface)"
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
          disabled={selected.size === 0}>
          Practice {selected.size} {selected.size === 1 ? "word" : "words"}
        </Button>
      </Box>
    </Flex>
  );
};
