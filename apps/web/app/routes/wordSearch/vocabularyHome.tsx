import { Link } from "react-router";
import {
  Avatar,
  Box,
  Button,
  Divider,
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
import { type StoredMeaning, type VocabularyEntry } from "./vocabulary";
import { monoLabel } from "./typography";
import { useAuth } from "../../lib/auth";

interface VocabularyHomeProps {
  words: [string, VocabularyEntry][];
  total: number;
  dueCount: number;
  isFromOfflineCopy: boolean;
  onOpenLookup: (query?: string) => void;
}

function firstSense(entry: VocabularyEntry): StoredMeaning | undefined {
  const group = entry.groups[0];
  if (!group) {
    return undefined;
  }
  return Object.values(group.meanings).sort((a, b) => a.order - b.order)[0];
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
          <Title order={1} fw={400} style={{ fontSize: 26, lineHeight: 1.1 }}>
            Your Vocabulary
          </Title>
          <Text ff="monospace" size="xs" c="dimmed" mt={5}>
            {isSignedIn
              ? `${wordCountLabel} · ${dueCount} due today`
              : `${wordCountLabel} · offline copy`}
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
                  onClick={handleSignOut}>
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
        <Text size="sm" c="dimmed">
          Look up a new word…
        </Text>
      </UnstyledButton>

      {!isSignedIn ? (
        <Paper radius={15} p={16} bg="var(--color-surface-inverse)">
          <Text fw={600} fz={13.5} c="var(--color-text-on-inverse)">
            Unlock sentence practice
          </Text>
          <Text
            mt={5}
            fz={12.5}
            style={{
              lineHeight: 1.5,
              color: "var(--color-text-on-inverse-dimmed)",
            }}>
            Sign in to practice with generated sentences. Your saved words and
            guess-the-word practice stays available when signed out.
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
          <Text {...monoLabel}>Due for practice</Text>
          <Text className="serif" mt={6} style={{ fontSize: 19 }}>
            {dueLabel}
          </Text>
          <Button
            component={Link}
            to="/practice"
            fullWidth
            mt={14}
            size="md"
            radius="md">
            Start practice session
          </Button>
        </Paper>
      ) : null}

      <Box>
        <Text {...monoLabel} mb={6}>
          {isSignedIn ? "All words" : "All words · browsable offline"}
        </Text>
        {total === 0 ? (
          <Text size="sm" c="dimmed" py={16}>
            No words yet. Look up a word to start building your vocabulary.
          </Text>
        ) : (
          <Stack gap={0}>
            {words.map(([word, entry], index) => {
              const sense = firstSense(entry);
              return (
                <Box key={word}>
                  {index > 0 ? <Divider /> : null}
                  <UnstyledButton
                    onClick={() => onOpenLookup(entry.display ?? word)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "12px 0",
                      width: "100%",
                    }}>
                    <Box
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        marginTop: 7,
                        flex: "none",
                        // TODO: re-visit all colors and fonts and centralize them
                        background: entry.shouldPracticeLater
                          ? "var(--color-warning)"
                          : "rgba(0,0,0,.2)",
                      }}
                    />
                    <Box flex={1} miw={0}>
                      <Text className="serif" style={{ fontSize: 17 }}>
                        {entry.display ?? word}
                        {entry.groups[0] ? (
                          <Text
                            span
                            className="serif"
                            c="dimmed"
                            ml={6}
                            style={{ fontStyle: "italic", fontSize: 12 }}>
                            {entry.groups[0].part_of_speech}
                          </Text>
                        ) : null}
                      </Text>
                      {sense ? (
                        <Text size="xs" c="dimmed" mt={2} lineClamp={1}>
                          {sense.definition}
                        </Text>
                      ) : null}
                    </Box>
                  </UnstyledButton>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Stack>
  );
};
