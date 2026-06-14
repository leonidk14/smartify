import { ActionIcon, Flex, TextInput, useMantineTheme } from "@mantine/core";
import { IconArrowRight, IconSearch } from "@tabler/icons-react";

export const WordSearch = () => {
  const theme = useMantineTheme();

  return (
    <Flex justify="center" direction="column" px={16} flex={1}>
      <TextInput
        radius="xl"
        size="md"
        placeholder="Which word to search for?"
        rightSectionWidth={42}
        rightSection={
          <ActionIcon
            size={32}
            radius="xl"
            color={theme.primaryColor}
            variant="filled"
            aria-label="Search">
            <IconSearch size={18} stroke={1.5} />
          </ActionIcon>
        }
        aria-label="Which word to search for?"
      />
    </Flex>
  );
};
