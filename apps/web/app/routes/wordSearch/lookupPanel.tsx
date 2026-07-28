import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { GeneratedSentence } from "../practice/sentenceTypes";
import { normalize } from "./normalize";
import type { StoredMeaningGroup, VocabularyEntry } from "./vocabulary";
import { text, textCss } from "../../theme/typography";
import { useKeyboardInset } from "../../lib/useKeyboardInset";
import { useAuth } from "../../lib/auth";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const keyboardInset = useKeyboardInset();
  const { isSignedIn, openSignIn } = useAuth();

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
    // Dismisses the on-screen keyboard on mobile — the result needs the room.
    inputRef.current?.blur();
    setValue(term);
    setCommittedQuery(term);
    setMarkedForPractice(false);
    // A new word needs the LLM lookup, which requires a signed-in user; the
    // sign-in-required view below handles the signed-out case.
    if (!findCached(term) && isSignedIn) {
      searchFetcher.submit({ "search-item": term }, { method: "post" });
    }
  };

  useEffect(() => {
    if (committedQuery && !cachedResult && isSignedIn) {
      searchFetcher.submit(
        { "search-item": committedQuery },
        { method: "post" },
      );
    }
  }, []);

  useEffect(() => {
    // A signed-out lookup of a new word parks on the sign-in prompt; once the
    // user signs in there, send them back to home. Keyed on auth only — adding
    // the query deps would wrongly close the panel mid-search once signed in.
    if (isSignedIn && committedQuery.trim().length > 0 && !cachedResult) {
      onClose();
    }
  }, [isSignedIn]);

  const data: PanelResult | undefined = cachedResult ?? searchFetcher.data;

  const query = value.trim().toLowerCase();
  const isLoading =
    searchFetcher.state === "loading" || searchFetcher.state === "submitting";
  const isDirty = query !== committedQuery.trim().toLowerCase();
  const isShowingSearchOutcome = !isLoading && !isDirty;

  const groups = data?.dictionary?.groups ?? null;
  const typo = isShowingSearchOutcome ? data?.dictionary?.typo : undefined;
  const hasResult = isShowingSearchOutcome && !!groups && groups.length > 0;
  const isNothingFound =
    isShowingSearchOutcome && !!groups && groups.length === 0 && !typo;
  const isError =
    isShowingSearchOutcome &&
    !!data &&
    (!data.dictionary || !data.dictionary.groups);
  const isSignInRequired =
    isShowingSearchOutcome &&
    !isSignedIn &&
    committedQuery.trim().length > 0 &&
    !cachedResult;

  const originalSearchItem = data?.originalSearchItem;

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

  const suggestions =
    query.length > 0 && !hasResult
      ? savedWords
          .map(([word, entry]) => entry.display ?? word)
          .filter((suggestion) => suggestion.includes(query))
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
      top={0}
      left={0}
      right={0}
      bottom={keyboardInset}
      bg="var(--color-surface)"
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
          <Text {...text.metaLg}>Look up</Text>
        </Group>
        <Group gap={8} align="stretch" wrap="nowrap">
          <TextInput
            ref={inputRef}
            name="search-item"
            placeholder="Type a word…"
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
            autoFocus={!initialQuery}
            size="md"
            radius="md"
            leftSection={<IconSearch size={16} />}
            flex={1}
            type="search"
            autoComplete="off"
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
            <Text {...text.body}>Searching for the meaning…</Text>
            <Loader size="sm" color="ink" />
          </Group>
        ) : hasResult && groups ? (
          <WordResult word={originalSearchItem ?? value} groups={groups} />
        ) : typo ? (
          <Text {...text.body} ta="center" mt={40}>
            Did you mean{" "}
            <Text
              {...text.emphasis}
              span
              style={{ cursor: "pointer" }}
              onClick={() => commitSearch(typo.suggestion)}>
              {typo.suggestion}
            </Text>
            ?
          </Text>
        ) : isNothingFound ? (
          <Text {...text.body} ta="center" mt={40}>
            We couldn't find anything :(
          </Text>
        ) : isError ? (
          <Text {...text.body} ta="center" mt={40}>
            Something went wrong :(
          </Text>
        ) : suggestions.length > 0 ? (
          <Stack gap={0}>
            <Text {...text.label} mb={8}>
              Suggestions
            </Text>
            {suggestions.map((suggestion) => {
              const matchStart = suggestion.indexOf(query);
              const matchEnd = matchStart + query.length;
              return (
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
                  <Text {...text.body}>
                    {suggestion.slice(0, matchStart)}
                    <Text {...text.emphasis} span>
                      {suggestion.slice(matchStart, matchEnd)}
                    </Text>
                    {suggestion.slice(matchEnd)}
                  </Text>
                </UnstyledButton>
              );
            })}
          </Stack>
        ) : isSignInRequired ? (
          <Stack align="center" gap={12} mt={40}>
            <Text {...text.body} ta="center">
              Sign in to look up new words
            </Text>
            <Text {...text.bodySm} c="dimmed" ta="center" maw={260}>
              New lookups are generated on the fly. Your saved words stay
              available offline.
            </Text>
            <Button radius="md" onClick={() => openSignIn()}>
              Sign in
            </Button>
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
            disabled={
              !isSignedIn || isMarkingForPractice || isAddedForPractice
            }
            loading={isMarkingForPractice}>
            {isAddedForPractice ? "Added for practice" : "Practice later"}
          </Button>
        </Box>
      ) : null}
    </Flex>
  );
};

const formatExample = ({ original, source }: GeneratedSentence): string =>
  source ? `'${original}' — ${source}` : `'${original}'`;

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
                  label: { ...textCss.annotation, textTransform: "none" },
                }}>
                {group.part_of_speech}
              </Badge>
              <Divider flex={1} />
              <Text {...text.meta}>
                {senses.length} {senses.length === 1 ? "sense" : "senses"}
              </Text>
            </Group>
            {senses.map((sense, index) => {
              const example = sense.sentences?.[0]?.sentence;
              return (
                <Group key={index} gap={12} align="flex-start" wrap="nowrap">
                  <Text {...text.metaLg} pt={1}>
                    {index + 1}
                  </Text>
                  <Stack gap={6} flex={1}>
                    <Text {...text.body}>{sense.definition}</Text>
                    {example?.original ? (
                      <Text
                        {...text.annotation}
                        pl={10}
                        style={{ borderLeft: "2px solid rgba(0,0,0,.15)" }}>
                        {formatExample(example)}
                      </Text>
                    ) : null}
                  </Stack>
                </Group>
              );
            })}
          </Stack>
        );
      })}
    </Stack>
  );
};
