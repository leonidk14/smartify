import { Button, Divider, Flex, Textarea } from "@mantine/core";
import { useFetcher } from "react-router";

export const WordSearch = () => {
  const fetcher = useFetcher();

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
        <Flex flex={1} mt="xl" justify="center">
          <Button variant="filled" size="lg" type="submit">
            Search
          </Button>
        </Flex>
      </Flex>
    </fetcher.Form>
  );
};
