import { Link } from "react-router";
import { Badge, Flex, Paper, Text, Group } from "@mantine/core";
import type { VocabularyEntry } from "../wordSearch/vocabulary.server";

interface PracticeListProps {
  words: [string, VocabularyEntry][];
}

export const PracticeList = ({ words }: PracticeListProps) => {
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
      {words.map(([word, entry]) => (
        <Paper
          key={word}
          component={Link}
          to={`/practice/${encodeURIComponent(word)}`}
          p="md"
          withBorder
          style={{ textDecoration: "none", color: "inherit" }}>
          <Group justify="space-between">
            <Text size="lg" fw={500} tt="capitalize">
              {word}
            </Text>
            {entry.shouldPracticeLater && (
              <Badge color="dark" size="sm">
                Practice
              </Badge>
            )}
          </Group>
        </Paper>
      ))}
    </Flex>
  );
};
