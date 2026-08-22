import { useState } from "react";
import { Link, useFetcher } from "react-router";
import {
  Avatar,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCloudOff, IconLogout, IconPlus } from "@tabler/icons-react";
import { type VocabularyEntry } from "./vocabulary";
import { DeleteWordDrawer } from "./deleteWordDrawer";
import { VocabularyRow } from "./vocabularyRow";
import { text } from "../../theme/typography";
import { useAuth } from "../../lib/authContext";

interface VocabularyHomeProps {
  words: [string, VocabularyEntry][];
  total: number;
  dueCount: number;
  isFromOfflineCopy: boolean;
  onOpenLookup: (query?: string) => void;
}

function initialsFromEmail(email: string | undefined): string {
  if (!email) {
    return "?";
  }
  return email.slice(0, 2).toUpperCase();
}

export const VocabularyHome = ({
  words,
  total,
  dueCount,
  isFromOfflineCopy,
  onOpenLookup,
}: VocabularyHomeProps) => {
  const { isSignedIn, user, signOut, openSignIn } = useAuth();

  const deleteFetcher = useFetcher<{ success: boolean }>();
  const [wordToDelete, setWordToDelete] = useState<{
    key: string;
    display: string;
  } | null>(null);
  const isDeleting = deleteFetcher.state !== "idle";

  const handleConfirmDelete = async () => {
    if (wordToDelete === null) {
      return;
    }
    await deleteFetcher.submit(
      { intent: "delete", word: wordToDelete.key },
      { method: "post" },
    );
    notifications.show({ message: `Deleted “${wordToDelete.display}”` });
    setWordToDelete(null);
  };

  const handleSignOut = async () => {
    await signOut();
    notifications.show({ message: "Signed out" });
  };

  const wordCountLabel = `${total} ${total === 1 ? "word" : "words"}`;
  const dueLabel =
    dueCount > 0
      ? `${dueCount} ${dueCount === 1 ? "word is" : "words are"} ready`
      : "Practice your vocabulary";

  return (
    <Stack gap={18} p={20} pb={96}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box>
          <Title order={1}>Your Vocabulary</Title>
          <Text {...text.meta} mt={5}>
            {isSignedIn
              ? `${wordCountLabel} · ${dueCount} due today`
              : `${wordCountLabel} · sample`}
          </Text>
        </Box>
        <Group gap={8} wrap="nowrap" align="center">
          {isFromOfflineCopy ? (
            <Tooltip label="Offline — showing the downloaded copy">
              <ThemeIcon
                variant="transparent"
                color="yellow"
                size="lg"
                aria-label="Offline — showing the downloaded copy">
                <IconCloudOff size={20} />
              </ThemeIcon>
            </Tooltip>
          ) : null}
          {isSignedIn ? (
            <Menu position="bottom-end" width={200}>
              <Menu.Target>
                <Avatar
                  radius="xl"
                  size={34}
                  aria-label="Account"
                  style={{
                    background: "var(--color-text)",
                    color: "#fff",
                    cursor: "pointer",
                  }}>
                  {initialsFromEmail(user?.email)}
                </Avatar>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user?.email}</Menu.Label>
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  onClick={() => void handleSignOut()}>
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Button size="sm" radius="xl" onClick={() => openSignIn()}>
              Sign in
            </Button>
          )}
        </Group>
      </Group>

      <UnstyledButton
        onClick={() => onOpenLookup()}
        style={{
          height: 46,
          border: "1.5px solid rgba(0,0,0,.16)",
          borderRadius: 13,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 16px",
          color: "rgba(0,0,0,.42)",
        }}>
        <IconPlus size={18} />
        <Text {...text.bodySm} c="dimmed">
          Look up a new word…
        </Text>
      </UnstyledButton>

      {!isSignedIn ? (
        <Paper radius={15} p={16} bg="var(--color-surface-inverse)">
          <Text {...text.uiLabel} c="var(--color-text-on-inverse)">
            Unlock your vocabulary
          </Text>
          <Text {...text.bodyXs} mt={5} c="var(--color-text-on-inverse-dimmed)">
            These are sample words. Sign in to see the words you saved and to
            practice with generated sentences.
          </Text>
          <Button
            variant="white"
            color="dark"
            fullWidth
            mt={13}
            radius={11}
            onClick={() => openSignIn()}>
            Sign in to continue
          </Button>
        </Paper>
      ) : null}

      {total > 0 ? (
        <Paper
          radius={15}
          p={16}
          style={{
            background: "var(--color-surface-warm)",
            border: "1px solid rgba(0,0,0,.08)",
          }}>
          <Text {...text.label}>Due for practice</Text>
          <Text {...text.displaySm} mt={6}>
            {dueLabel}
          </Text>
          <Button
            component={Link}
            to={`/practice/select?mode=${isSignedIn ? "both" : "word"}&preselect=marked`}
            fullWidth
            mt={14}
            size="md"
            radius="md">
            Start practice session
          </Button>
        </Paper>
      ) : null}

      <Box>
        <Text {...text.label} mb={6}>
          {isSignedIn ? "All words" : "Sample words"}
        </Text>
        {total === 0 ? (
          <Text {...text.bodySm} c="dimmed" py={16}>
            No words yet. Look up a word to start building your vocabulary.
          </Text>
        ) : (
          <Stack gap={0}>
            {words.map(([word, entry], index) => (
              <VocabularyRow
                key={word}
                word={word}
                entry={entry}
                showDivider={index > 0}
                onOpenLookup={onOpenLookup}
                onRequestDelete={setWordToDelete}
              />
            ))}
          </Stack>
        )}
      </Box>

      <DeleteWordDrawer
        wordToDelete={wordToDelete}
        opened={wordToDelete !== null}
        loading={isDeleting}
        onCancel={() => setWordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </Stack>
  );
};
