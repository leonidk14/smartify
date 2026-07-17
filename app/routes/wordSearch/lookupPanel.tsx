import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronLeft, IconSearch } from "@tabler/icons-react";
import type { LookupResult, Typo } from "./actions";
import { normalize } from "./normalize";
import type { StoredMeaningGroup, VocabularyEntry } from "./vocabulary";
import { monoLabel } from "./typography";

type SearchResult = Omit<LookupResult, "dictionary"> & {
  dictionary: { groups: StoredMeaningGroup[]; typo?: Typo };
};

type PanelResult = {
  dictionary?: { groups: StoredMeaningGroup[]; typo?: Typo };
  originalSearchItem?: string;
  shouldPracticeLater?: boolean;
};

interface LookupPanelProps {
  onClose: () => void;
  savedWords: [string, VocabularyEntry][];
  initialQuery?: string;
}

const MAX_SUGGESTIONS = 4;

export const LookupPanel = ({
  onClose,
  savedWords,
  initialQuery,
}: LookupPanelProps) => {
  const searchFetcher = useFetcher<SearchResult>();
  const practiceFetcher = useFetcher<{ success: boolean }>();
  const [value, setValue] = useState(initialQuery ?? "");
  const [committedQuery, setCommittedQuery] = useState(initialQuery ?? "");
  const [markedForPractice, setMarkedForPractice] = useState(false);

  const findCached = useCallback(
    (term: string): PanelResult | undefined => {
      const entry = savedWords.find(([word]) => word === normalize(term))?.[1];
      if (!entry || entry.groups.length === 0) {
        return undefined;
      }
      return {
        dictionary: { groups: entry.groups },
        originalSearchItem: term,
        shouldPracticeLater: entry.shouldPracticeLater,
      };
    },
    [savedWords],
  );

  const cachedResult = useMemo(
    () => findCached(committedQuery),
    [findCached, committedQuery],
  );

  const commitSearch = (term: string) => {
    setValue(term);
    setCommittedQuery(term);
    setMarkedForPractice(false);
    if (!findCached(term)) {
      searchFetcher.submit({ "search-item": term }, { method: "post" });
    }
  };

  useEffect(() => {
    if (committedQuery && !cachedResult) {
      searchFetcher.submit(
        { "search-item": committedQuery },
        { method: "post" },
      );
    }
  }, []);

  const data: PanelResult | undefined = cachedResult ?? searchFetcher.data;

  const isLoading =
    searchFetcher.state === "loading" || searchFetcher.state === "submitting";
  const typo = !isLoading ? data?.dictionary?.typo : undefined;
  const groups = data?.dictionary?.groups ?? null;
  const isNothingFound = !isLoading && !!groups && groups.length === 0 && !typo;
  const isError =
    !isLoading && !!data && (!data.dictionary || !data.dictionary.groups);

  const originalSearchItem = data?.originalSearchItem;
  const isDirty =
    !!groups &&
    originalSearchItem !== undefined &&
    value.trim().toLowerCase() !== originalSearchItem.trim().toLowerCase();

  const hasResult = !isLoading && !!groups && groups.length > 0 && !isDirty;

  const isMarkingForPractice =
    practiceFetcher.state === "submitting" ||
    practiceFetcher.state === "loading";
  const isAddedForPractice = data?.shouldPracticeLater || markedForPractice;

  useEffect(() => {
    if (practiceFetcher.data?.success) {
      setMarkedForPractice(true);
    }
  }, [practiceFetcher.data]);

  const handlePracticeLater = () => {
    if (!originalSearchItem) {
      return;
    }
    practiceFetcher.submit(
      { intent: "practice", word: originalSearchItem },
      { method: "post" },
    );
  };

  const query = value.trim().toLowerCase();
  const suggestions =
    query.length > 0 && !hasResult
      ? savedWords
          .map(([word, entry]) => entry.display ?? word)
          .filter((suggestion) => suggestion.startsWith(query))
          .slice(0, MAX_SUGGESTIONS)
      : [];

  return (
    <Flex
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (query.length > 0) {
          commitSearch(value);
        }
      }}
      direction="column"
      pos="fixed"
      inset={0}
      bg="white"
      mih={0}
      style={{ zIndex: 200 }}>
      <Box p={16} pb={12}>
        <Group gap={10} mb={14}>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            aria-label="Back"
            onClick={onClose}>
            <IconChevronLeft size={22} />
          </ActionIcon>
          <Text ff="monospace" size="sm" c="dimmed" fw={500}>
            Look up
          </Text>
        </Group>
        <Group gap={8} align="stretch" wrap="nowrap">
          <TextInput
            name="search-item"
            placeholder="Type a word…"
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
            autoFocus={!initialQuery}
            size="md"
            radius="md"
            leftSection={<IconSearch size={16} />}
            flex={1}
          />
          <Button
            type="submit"
            size="md"
            radius="md"
            disabled={query.length === 0 || isLoading}>
            Search
          </Button>
        </Group>
      </Box>

      {hasResult ? <Divider /> : null}

      <ScrollArea flex={1} mih={0} px={20} py={16}>
        {isLoading ? (
          <Group gap={8} justify="center" mt={40}>
            <Text size="md">Searching for the meaning…</Text>
            <Loader size="sm" color="ink" />
          </Group>
        ) : hasResult && groups ? (
          <WordResult word={originalSearchItem ?? value} groups={groups} />
        ) : typo ? (
          <Text size="md" ta="center" mt={40}>
            Did you mean{" "}
            <Text
              span
              fw={700}
              style={{ cursor: "pointer" }}
              onClick={() => setValue(typo.suggestion)}>
              {typo.suggestion}
            </Text>
            ?
          </Text>
        ) : isNothingFound ? (
          <Text size="md" ta="center" mt={40}>
            We couldn't find anything :(
          </Text>
        ) : isError ? (
          <Text size="md" ta="center" mt={40}>
            Something went wrong :(
          </Text>
        ) : suggestions.length > 0 ? (
          <Stack gap={0}>
            <Text {...monoLabel} mb={8}>
              Suggestions
            </Text>
            {suggestions.map((suggestion) => (
              <UnstyledButton
                key={suggestion}
                onClick={() => commitSearch(suggestion)}
                py={11}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  borderBottom: "1px solid rgba(0,0,0,.06)",
                }}>
                <IconSearch size={16} color="rgba(0,0,0,.3)" />
                <Text size="md">
                  <Text span fw={600}>
                    {suggestion.slice(0, query.length)}
                  </Text>
                  {suggestion.slice(query.length)}
                </Text>
              </UnstyledButton>
            ))}
          </Stack>
        ) : null}
      </ScrollArea>

      {hasResult ? (
        <Box p={16} style={{ borderTop: "1px solid rgba(0,0,0,.07)" }}>
          <Button
            fullWidth
            size="lg"
            radius="md"
            type="button"
            onClick={handlePracticeLater}
            disabled={isMarkingForPractice || isAddedForPractice}
            loading={isMarkingForPractice}>
            {isAddedForPractice ? "Added for practice" : "Practice later"}
          </Button>
        </Box>
      ) : null}
    </Flex>
  );
};

const WordResult = ({
  word,
  groups,
}: {
  word: string;
  groups: StoredMeaningGroup[];
}) => {
  return (
    <Stack gap={22}>
      <Title order={2}>{word}</Title>
      {groups.map((group) => {
        const senses = Object.values(group.meanings).sort(
          (a, b) => a.order - b.order,
        );
        return (
          <Stack key={group.part_of_speech} gap={12}>
            <Group gap={10} wrap="nowrap">
              <Badge
                variant="outline"
                color="gray"
                radius="xl"
                styles={{
                  label: {
                    fontFamily: "var(--font-serif)",
                    fontStyle: "italic",
                    textTransform: "none",
                    fontWeight: 400,
                  },
                }}>
                {group.part_of_speech}
              </Badge>
              <Divider flex={1} />
              <Text ff="monospace" size="xs" c="dimmed">
                {senses.length} {senses.length === 1 ? "sense" : "senses"}
              </Text>
            </Group>
            {senses.map((sense, index) => (
              <Group key={index} gap={12} align="flex-start" wrap="nowrap">
                <Text ff="monospace" size="sm" c="dimmed" pt={1}>
                  {index + 1}
                </Text>
                <Stack gap={6} flex={1}>
                  <Text size="md">{sense.definition}</Text>
                  {sense.example ? (
                    <Text
                      className="serif"
                      fs="italic"
                      size="sm"
                      c="dimmed"
                      pl={10}
                      style={{ borderLeft: "2px solid rgba(0,0,0,.15)" }}>
                      {sense.example}
                    </Text>
                  ) : null}
                </Stack>
              </Group>
            ))}
          </Stack>
        );
      })}
    </Stack>
  );
};
