import { useMemo } from "react";
import { Link } from "react-router";
import { Button, Center, Stack, Text } from "@mantine/core";
import { PracticeWord } from "./practice/practiceWord";
import { useVocabulary } from "./wordSearch/useVocabulary";
import type { VocabularyStore } from "./wordSearch/vocabulary";
import type { Route } from "./+types/practiceWord";

interface WordView {
  word: string;
  definition: string;
  meaningId: string;
  partOfSpeech: string;
  hints: string[];
  display?: string;
}

function buildWordView(store: VocabularyStore, word: string): WordView | null {
  const entry = store[word];
  if (!entry) {
    return null;
  }

  const allMeanings = entry.groups.flatMap((g) =>
    Object.entries(g.meanings).map(([id, m]) => ({
      id,
      definition: m.definition,
      partOfSpeech: g.part_of_speech,
    })),
  );
  if (allMeanings.length === 0) {
    return null;
  }

  const selected = allMeanings[Math.floor(Math.random() * allMeanings.length)];

  const otherWords = Object.entries(store).filter(
    ([key, v]) => key !== word && v.groups.length > 0,
  );
  const samePos = otherWords.filter(([, v]) =>
    v.groups.some((g) => g.part_of_speech === selected.partOfSpeech),
  );

  const shuffled = [...samePos].sort(() => Math.random() - 0.5);
  const decoys = shuffled.slice(0, 2).map(([key]) => key);
  const hints = buildHints({ correct: word, decoys });

  return {
    word,
    definition: selected.definition,
    meaningId: selected.id,
    partOfSpeech: selected.partOfSpeech,
    hints,
    display: entry.display,
  };
}

function buildHints({
  correct,
  decoys,
}: {
  correct: string;
  decoys: string[];
}): string[] {
  const result = [...decoys.slice(0, 2)];
  const index = Math.floor(Math.random() * 3);
  result.splice(index, 0, correct);
  return result;
}

export default function PracticeWordRoute({ params }: Route.ComponentProps) {
  const { store } = useVocabulary();
  const view = useMemo(() => buildWordView(store, params.word), [params.word]);

  if (!view) {
    return (
      <Center flex={1} p={24}>
        <Stack align="center" gap={12}>
          <Text size="md" c="dimmed">
            Word not found
          </Text>
          <Button component={Link} to="/practice" variant="light" radius="md">
            Back to practice
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <PracticeWord
      key={view.word}
      word={view.word}
      definition={view.definition}
      meaningId={view.meaningId}
      partOfSpeech={view.partOfSpeech}
      hints={view.hints}
      display={view.display}
    />
  );
}
