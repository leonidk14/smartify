import {
  Button,
  Divider,
  Flex,
  Loader,
  Textarea,
  Text,
  List,
  ThemeIcon,
} from "@mantine/core";
import { IconBook } from "@tabler/icons-react";
import { useFetcher } from "react-router";
import type { LookupResult } from "./actions";

export const WordSearch = () => {
  const fetcher = useFetcher<LookupResult>();

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
    (!fetcher.data ||
      !fetcher.data.dictionary ||
      !fetcher.data.dictionary.meaning);

  const meanings =
    fetcher.data && fetcher.data.dictionary && fetcher.data.dictionary.meaning
      ? fetcher.data.dictionary.meaning
      : null;

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
        />
        <Divider />
        <Flex flex={1} mt={8} align="center" direction="column" gap={16}>
          {isNothingFound ? (
            <Text size="md">We couldn't find anything :(</Text>
          ) : null}
          {isError ? <Text size="md">Something went wrong :(</Text> : null}
          {isFirstSearch || isNothingFound || isError ? (
            <Button variant="filled" size="lg" type="submit">
              Search
            </Button>
          ) : null}
          {isLoading ? (
            <Flex gap={8} align="center">
              <Text size="md">Searching for the meaning...</Text>
              <Loader size="sm" color="blue" />
            </Flex>
          ) : null}
          {meanings ? (
            <List
              spacing="md"
              icon={
                <ThemeIcon color="blue" size={24} radius="xl">
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
    </fetcher.Form>
  );
};
