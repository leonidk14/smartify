import { useNavigate } from "react-router";
import { Box, Center, Group, Paper, Stack, Text, Title } from "@mantine/core";
import {
  IconChevronRight,
  IconListNumbers,
  IconPencil,
  IconQuestionMark,
} from "@tabler/icons-react";
import { monoLabel } from "../wordSearch/typography";
import { NotificationBanner } from "./notificationBanner";
import type { PracticeMode } from "../../store/session";

interface PracticeStartProps {
  total: number;
  markedCount: number;
}

interface ModeOption {
  mode: PracticeMode;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const OPTIONS: ModeOption[] = [
  {
    mode: "word",
    title: "Guess a word",
    description: "from its definition",
    icon: <IconQuestionMark size={18} />,
  },
  {
    mode: "sentence",
    title: "Rebuild a sentence",
    description: "use the word in context",
    icon: <IconPencil size={18} />,
  },
  {
    mode: "both",
    title: "Do both",
    description: "one after another",
    icon: <IconListNumbers size={18} />,
  },
];

export const PracticeStart = ({ total, markedCount }: PracticeStartProps) => {
  const navigate = useNavigate();

  return (
    <Stack gap={22} p={20} pb={96}>
      <Box>
        <Title order={1} fw={400} fz={26} lh={1.1}>
          Practice
        </Title>
        <Text ff="monospace" size="xs" c="dimmed" mt={5}>
          {markedCount} {markedCount === 1 ? "word" : "words"} marked for
          practice
        </Text>
      </Box>

      <NotificationBanner />

      <Box>
        <Text {...monoLabel} mb={10}>
          Choose a mode
        </Text>
        <Stack gap={10}>
          {OPTIONS.map((option) => (
            <Paper
              key={option.mode}
              radius={14}
              px={15}
              py={14}
              onClick={() => navigate(`/practice/select?mode=${option.mode}`)}
              style={{
                border: "1.5px solid rgba(0,0,0,.14)",
                cursor: "pointer",
                userSelect: "none",
              }}>
              <Group gap={13} wrap="nowrap">
                <Center
                  w={34}
                  h={34}
                  bg="var(--surface-warm)"
                  c="dark.9"
                  flex="none"
                  style={{ borderRadius: 9 }}>
                  {option.icon}
                </Center>
                <Box flex={1} miw={0}>
                  <Text fw={600} fz={14}>
                    {option.title}
                  </Text>
                  <Text size="xs" c="dimmed" mt={1}>
                    {option.description}
                  </Text>
                </Box>
                <IconChevronRight
                  size={18}
                  style={{ color: "rgba(0,0,0,.28)", flex: "none" }}
                />
              </Group>
            </Paper>
          ))}
        </Stack>
      </Box>

      {total === 0 ? (
        <Text size="sm" c="dimmed">
          No words saved yet. Look up words to build your vocabulary.
        </Text>
      ) : null}
    </Stack>
  );
};
