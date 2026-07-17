import { useState } from "react";
import { Link } from "react-router";
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCloudOff, IconDownload, IconPlus } from "@tabler/icons-react";
import {
  downloadForOffline,
  type StoredMeaning,
  type VocabularyEntry,
} from "./vocabulary";
import { monoLabel } from "./typography";

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

export const VocabularyHome = ({
  words,
  total,
  dueCount,
  isFromOfflineCopy,
  onOpenLookup,
}: VocabularyHomeProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadForOffline = async () => {
    setIsDownloading(true);
    try {
      await downloadForOffline();
      notifications.show({ message: "Vocabulary saved for offline use" });
    } catch (error) {
      console.error("Failed to download vocabulary for offline use:", error);
      notifications.show({
        color: "red",
        message: "Couldn’t download vocabulary. Check your connection.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Stack gap={18} p={20} pb={96}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box>
          <Title order={1} fw={400} style={{ fontSize: 26, lineHeight: 1.1 }}>
            My Vocabulary
          </Title>
          <Text ff="monospace" size="xs" c="dimmed" mt={5}>
            {total} {total === 1 ? "word" : "words"} · {dueCount} due today
          </Text>
        </Box>
        {/* TODO: put a light/dark theme toggle next to these buttons (was a
            settings gear in the design; descoped for now). */}
        <Group gap={4} wrap="nowrap">
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
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            radius="md"
            aria-label="Download vocabulary for offline use"
            disabled={isFromOfflineCopy}
            loading={isDownloading}
            onClick={handleDownloadForOffline}>
            <IconDownload size={20} />
          </ActionIcon>
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

      {total > 0 ? (
        <Paper
          radius={15}
          p={16}
          style={{
            background: "var(--surface-warm)",
            border: "1px solid rgba(0,0,0,.08)",
          }}>
          <Text {...monoLabel}>Due for practice</Text>
          <Text className="serif" mt={6} style={{ fontSize: 19 }}>
            {dueCount > 0
              ? `${dueCount} ${dueCount === 1 ? "word is" : "words are"} ready`
              : "Practice your vocabulary"}
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
          All words
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
                    // TODO: fix screen jump during navigation when clicking on a word
                    onClick={() => onOpenLookup(word)}
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
                          ? "#c87a1e"
                          : "rgba(0,0,0,.2)",
                      }}
                    />
                    <Box flex={1} miw={0}>
                      <Text className="serif" style={{ fontSize: 17 }}>
                        {word}
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
