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
  const isNothingFound =
    !isLoading &&
    fetcher.data &&
    fetcher.data.dictionary.meaning &&
    fetcher.data.dictionary.meaning.length === 0;
  const isError =
    !isLoading &&
    fetcher.data &&
    (!fetcher.data.dictionary || !fetcher.data.dictionary.meaning);

  const meanings =
    fetcher.data && fetcher.data.dictionary && fetcher.data.dictionary.meaning
      ? fetcher.data.dictionary.meaning
      : null;

  const originalSearchItem = fetcher.data?.originalSearchItem;
  const isDirty =
    !!meanings &&
    originalSearchItem !== undefined &&
    value.trim().toLowerCase() !== originalSearchItem.trim().toLowerCase();
  const showFloatingButton = isDirty && !isLoading;

  const hasData = meanings && meanings.length > 0;

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
          {isFirstSearch || isNothingFound || isError ? (
            <Button variant="filled" size="lg" color="black" type="submit">
              Search
            </Button>
          ) : null}
          {isLoading ? (
            <Flex gap={8} align="center">
              <Text size="md">Searching for the meaning...</Text>
              <Loader size="sm" color="black" />
            </Flex>
          ) : null}
          {hasData ? (
            <List
              spacing="md"
              size="xl"
              style={{
                opacity: isDirty ? 0.5 : 1,
                transition: "opacity 200ms ease",
              }}
              icon={
                <ThemeIcon color="black" size={24} radius="xl">
                  <IconBook size={16} />
                </ThemeIcon>
              }>
              {meanings.map((item) => (
                <List.Item>{item}</List.Item>
              ))}
            </List>
          ) : null}
        </Flex>
      </Flex>
      {hasData ? (
        <Transition
          mounted={showFloatingButton}
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
      ) : null}
    </fetcher.Form>
  );
};
