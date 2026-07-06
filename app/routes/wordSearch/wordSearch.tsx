import {
  Box,
  Button,
  Divider,
  Flex,
  Loader,
  Textarea,
  Text,
  List,
  ThemeIcon,
  Transition,
} from "@mantine/core";
import { IconBook } from "@tabler/icons-react";
import { useState } from "react";
import { useFetcher } from "react-router";
import type { LookupResult } from "./actions";

export const WordSearch = () => {
  const fetcher = useFetcher<LookupResult>();
  const [value, setValue] = useState("");

  const isLoading =
    fetcher.state === "loading" || fetcher.state === "submitting";
  const isFirstSearch = fetcher.state === "idle" && !fetcher.data;
  const typo = !isLoading ? fetcher.data?.dictionary?.typo : undefined;
  const isNothingFound =
    !isLoading &&
    fetcher.data &&
    fetcher.data.dictionary.groups &&
    fetcher.data.dictionary.groups.length === 0 &&
    !typo;
  const isError =
    !isLoading &&
    fetcher.data &&
    (!fetcher.data.dictionary || !fetcher.data.dictionary.groups);

  const groups =
    fetcher.data && fetcher.data.dictionary && fetcher.data.dictionary.groups
      ? fetcher.data.dictionary.groups
      : null;

  const originalSearchItem = fetcher.data?.originalSearchItem;
  const isDirty =
    !!groups &&
    originalSearchItem !== undefined &&
    value.trim().toLowerCase() !== originalSearchItem.trim().toLowerCase();
  const showFloatingButton = isDirty && !isLoading;

  const hasData = !isLoading && groups && groups.length > 0;

  return (
    <fetcher.Form method="post">
      <Flex direction="column" p={16} flex={1} gap={16}>
        <Textarea
          name="search-item"
          placeholder="Type what you are looking for"
          autosize
          minRows={2}
          maxRows={2}
          variant="unstyled"
          size="xl"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
        />
        <Divider />
        <Flex flex={1} mt={8} align="center" direction="column" gap={16}>
          {isNothingFound ? (
            <Text size="md">We couldn't find anything :(</Text>
          ) : null}
          {isError ? <Text size="md">Something went wrong :(</Text> : null}
          {typo ? (
            <Text size="md">
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
          ) : null}
          {isLoading ? (
            <Flex gap={8} align="center">
              <Text size="md">Searching for the meaning...</Text>
              <Loader size="sm" color="black" />
            </Flex>
          ) : null}
          <Transition
            mounted={
              (isFirstSearch || !!isNothingFound || !!isError || !!typo) &&
              !!value
            }
            transition="fade-up"
            duration={200}>
            {(transitionStyles) => (
              <Box style={transitionStyles}>
                <Button
                  mt={32}
                  variant="filled"
                  size="lg"
                  color="black"
                  type="submit">
                  Search
                </Button>
              </Box>
            )}
          </Transition>
          {hasData ? (
            <Flex
              direction="column"
              gap={24}
              style={{
                opacity: isDirty ? 0.5 : 1,
                transition: "opacity 200ms ease",
              }}>
              {groups.map((group) => (
                <Box key={group.part_of_speech}>
                  <Text size="lg" fs="italic" c="dimmed" mb={8}>
                    {group.part_of_speech}
                  </Text>
                  <List
                    spacing="md"
                    size="xl"
                    styles={{ itemWrapper: { alignItems: "flex-start" } }}
                    icon={
                      <ThemeIcon color="black" size={24} radius="xl">
                        <IconBook size={16} />
                      </ThemeIcon>
                    }>
                    {group.meanings.map((meaning) => (
                      <List.Item key={meaning.definition}>
                        <Text size="xl">{meaning.definition}</Text>
                        <Text size="md" c="dimmed" fs="italic" mt={4}>
                          {meaning.example}
                        </Text>
                      </List.Item>
                    ))}
                  </List>
                </Box>
              ))}
            </Flex>
          ) : null}
        </Flex>
      </Flex>
      <Transition
        mounted={!!hasData && showFloatingButton}
        transition="slide-up"
        duration={250}>
        {(transitionStyles) => (
          <Box
            style={{
              ...transitionStyles,
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
            }}>
            <Button variant="filled" size="lg" color="black" type="submit">
              Search
            </Button>
          </Box>
        )}
      </Transition>
    </fetcher.Form>
  );
};
