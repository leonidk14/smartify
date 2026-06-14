import { ActionIcon, Flex, TextInput, useMantineTheme } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { useFetcher } from "react-router";

export const WordSearch = () => {
  const [isEditMode, setIsEditMode] = useState(true);

  const fetcher = useFetcher();
  const theme = useMantineTheme();

  return (
    <Flex justify="center" direction="column" px={16} flex={1}>
      {isEditMode ? (
        <fetcher.Form method="post">
          <TextInput
            radius="xl"
            size="md"
            placeholder="Which word to search for?"
            name="search-item"
            rightSectionWidth={42}
            rightSection={
              <ActionIcon
                size={32}
                radius="xl"
                color={theme.primaryColor}
                variant="filled"
                aria-label="Search"
                type="submit">
                <IconSearch size={18} stroke={1.5} />
              </ActionIcon>
            }
            aria-label="Which word to search for?"
          />
        </fetcher.Form>
      ) : null}
    </Flex>
  );
};
