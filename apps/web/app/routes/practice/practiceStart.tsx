import { useNavigate } from "react-router";
import {
  Box,
  Button,
  Center,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconChevronRight,
  IconListNumbers,
  IconLock,
  IconPencil,
  IconQuestionMark,
} from "@tabler/icons-react";
import { text } from "../../theme/typography";
import { NotificationBanner } from "./notificationBanner";
import { useAuth } from "../../lib/auth";
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
  // Sentence-based modes call the LLM at the rebuild step, so they need a
  // signed-in user; "word" is answered from stored data and stays open.
  requiresAuth: boolean;
}

const OPTIONS: ModeOption[] = [
  {
    mode: "word",
    title: "Guess a word",
    description: "from its definition",
    icon: <IconQuestionMark size={18} />,
    requiresAuth: false,
  },
  {
    mode: "sentence",
    title: "Rebuild a sentence",
    description: "use the word in context",
    icon: <IconPencil size={18} />,
    requiresAuth: true,
  },
  {
    mode: "both",
    title: "Do both",
    description: "one after another",
    icon: <IconListNumbers size={18} />,
    requiresAuth: true,
  },
];

export const PracticeStart = ({ total, markedCount }: PracticeStartProps) => {
  const navigate = useNavigate();
  const { isSignedIn, openSignIn } = useAuth();

  return (
    <Stack gap={22} p={20} pb={96}>
      <Box>
        <Title order={1}>Practice</Title>
        <Text {...text.meta} mt={5}>
          {markedCount} {markedCount === 1 ? "word" : "words"} marked for
          practice
        </Text>
      </Box>

      {!isSignedIn ? (
        <Paper radius={15} p={16} bg="var(--color-surface-inverse)">
          <Text {...text.uiLabel} c="var(--color-text-on-inverse)">
            Sentence practice needs an account
          </Text>
          <Text
            {...text.bodyXs}
            mt={5}
            c="var(--color-text-on-inverse-dimmed)">
            Rebuild-the-sentence modes are generated on the fly, so they need
            sign-in. Guess-the-word practice and your saved words stay available
            offline.
          </Text>
          <Button
            variant="white"
            color="dark"
            fullWidth
            mt={13}
            radius={11}
            onClick={() => openSignIn()}>
            Sign in to practice
          </Button>
        </Paper>
      ) : null}

      <NotificationBanner />

      <Box>
        <Text {...text.label} mb={10}>
          Choose a mode
        </Text>
        <Stack gap={10}>
          {OPTIONS.map((option) => {
            const isLocked = option.requiresAuth && !isSignedIn;
            return (
              <Paper
                key={option.mode}
                radius={14}
                px={15}
                py={14}
                onClick={() =>
                  isLocked
                    ? openSignIn()
                    : navigate(`/practice/select?mode=${option.mode}`)
                }
                style={{
                  border: "1.5px solid rgba(0,0,0,.14)",
                  cursor: "pointer",
                  userSelect: "none",
                  opacity: isLocked ? 0.55 : 1,
                }}>
                <Group gap={13} wrap="nowrap">
                  <Center
                    w={34}
                    h={34}
                    bg="var(--color-surface-warm)"
                    c="dark.9"
                    flex="none"
                    style={{ borderRadius: 9 }}>
                    {option.icon}
                  </Center>
                  <Box flex={1} miw={0}>
                    <Text {...text.uiLabel}>{option.title}</Text>
                    <Text {...text.bodyXs} c="dimmed" mt={1}>
                      {option.description}
                    </Text>
                  </Box>
                  {isLocked ? (
                    <IconLock
                      size={16}
                      style={{ color: "rgba(0,0,0,.35)", flex: "none" }}
                    />
                  ) : (
                    <IconChevronRight
                      size={18}
                      style={{ color: "rgba(0,0,0,.28)", flex: "none" }}
                    />
                  )}
                </Group>
              </Paper>
            );
          })}
        </Stack>
      </Box>

      {total === 0 ? (
        <Text {...text.bodySm} c="dimmed">
          No words saved yet. Look up words to build your vocabulary.
        </Text>
      ) : null}
    </Stack>
  );
};
