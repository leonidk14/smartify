import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Badge,
  Box,
  Button,
  Flex,
  Group,
  NumberInput,
  Paper,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import type { VocabularyEntry } from "../wordSearch/vocabulary.server";
import { useSessionStore } from "../../store/session";

interface PracticeListProps {
  words: [string, VocabularyEntry][];
}

const LONG_PRESS_MS = 500;

const shuffle = <T,>(items: T[]): T[] =>
  [...items].sort(() => Math.random() - 0.5);

export const PracticeList = ({ words }: PracticeListProps) => {
  const navigate = useNavigate();
  const startSession = useSessionStore((s) => s.startSession);
  const reset = useSessionStore((s) => s.reset);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [count, setCount] = useState<number | string>(
    Math.min(5, words.length),
  );

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  useEffect(() => {
    reset();
  }, [reset]);

  const beginPractice = (wordList: string[]) => {
    if (wordList.length === 0) return;
    startSession(wordList);
    navigate(`/practice/${encodeURIComponent(wordList[0])}`);
  };

  const clearTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerDown = (word: string) => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setSelectMode(true);
      setSelected((prev) => (prev.includes(word) ? prev : [...prev, word]));
    }, LONG_PRESS_MS);
  };

  const toggle = (word: string) =>
    setSelected((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word],
    );

  const handleClick = (word: string) => {
    // Suppress the click that follows a long-press that just fired.
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    if (selectMode) {
      toggle(word);
      return;
    }
    beginPractice([word]);
  };

  const cancelSelection = () => {
    setSelectMode(false);
    setSelected([]);
  };

  const startSelected = () => {
    beginPractice(words.map(([w]) => w).filter((w) => selected.includes(w)));
  };

  const startRandom = () => {
    const n = typeof count === "number" ? count : parseInt(count, 10);
    if (!n || n < 1) return;
    const practicePool = words
      .filter(([, entry]) => entry.shouldPracticeLater)
      .map(([w]) => w);
    const pool =
      practicePool.length >= n ? practicePool : words.map(([w]) => w);
    beginPractice(shuffle(pool).slice(0, Math.min(n, pool.length)));
  };

  if (words.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" flex={1} p={16}>
        <Text size="lg" c="dimmed">
          No words saved yet. Search for words to build your vocabulary.
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" p={16} gap={8}>
      {!selectMode && (
        <Group gap={8} align="flex-end" mb={8}>
          <NumberInput
            label="Random practice"
            placeholder="How many words?"
            min={1}
            max={words.length}
            value={count}
            onChange={setCount}
            style={{ flex: 1 }}
          />
          <Button color="black" onClick={startRandom}>
            Practice random
          </Button>
        </Group>
      )}

      {words.map(([word, entry]) => {
        const isSelected = selected.includes(word);
        return (
          <Paper
            key={word}
            p="md"
            withBorder
            onPointerDown={() => handlePointerDown(word)}
            onPointerUp={clearTimer}
            onPointerLeave={clearTimer}
            onPointerMove={clearTimer}
            onClick={() => handleClick(word)}
            bg={isSelected ? "gray.1" : undefined}
            style={{
              cursor: "pointer",
              userSelect: "none",
              borderColor: isSelected
                ? "var(--mantine-color-dark-5)"
                : undefined,
            }}>
            <Group justify="space-between">
              <Group gap={8}>
                {selectMode && (
                  <ThemeIcon
                    size={22}
                    radius="xl"
                    variant={isSelected ? "filled" : "outline"}
                    color={isSelected ? "dark" : "gray"}>
                    {isSelected ? <IconCheck size={14} /> : <span />}
                  </ThemeIcon>
                )}
                <Text size="lg" fw={500} tt="capitalize">
                  {word}
                </Text>
              </Group>
              {entry.shouldPracticeLater && (
                <Badge color="dark" size="sm">
                  Practice
                </Badge>
              )}
            </Group>
          </Paper>
        );
      })}

      {selectMode && (
        <Box
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0), #fff 16px)",
            paddingTop: 32,
            paddingBottom: 16,
            display: "flex",
            justifyContent: "center",
            gap: 16,
          }}>
          <Button
            variant="outline"
            size="lg"
            color="dark"
            onClick={cancelSelection}>
            Cancel
          </Button>
          {selected.length > 0 ? (
            <Button
              variant="filled"
              size="lg"
              color="black"
              onClick={startSelected}>
              Start practice ({selected.length})
            </Button>
          ) : null}
        </Box>
      )}
    </Flex>
  );
};
