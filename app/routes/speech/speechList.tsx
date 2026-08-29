import { Link } from "react-router";
import {
  Box,
  Divider,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconChevronRight, IconMicrophone } from "@tabler/icons-react";
import { text } from "../../theme/typography";
import {
  formatDuration,
  formatRecordingDate,
  formatSavedBadge,
} from "./speechFormat";
import type { SpeechRecording } from "./speechTypes";

interface SpeechListProps {
  recordings: SpeechRecording[];
}

export function SpeechList({ recordings }: SpeechListProps) {
  return (
    <Stack gap={18} p={20} pb={96}>
      <Box>
        <Title order={1}>Speech</Title>
        <Text {...text.meta} mt={5}>
          {recordings.length}{" "}
          {recordings.length === 1 ? "recording" : "recordings"}
        </Text>
      </Box>

      <Box
        component={Link}
        to="/speech/record"
        bd="1.5px dashed rgba(0,0,0,.16)"
        bdrs={15}
        p="18px 16px"
        bg="var(--color-surface-warm)"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          textDecoration: "none",
          color: "inherit",
        }}>
        <ThemeIcon size={58} radius="50%" color="dark" variant="filled">
          <IconMicrophone size={22} />
        </ThemeIcon>
        <Text {...text.displaySm} ta="center">
          Say something, then make it sharper
        </Text>
        <Text {...text.bodyXs} c="dimmed" ta="center">
          Up to two minutes. A pitch, an answer, a voice note.
        </Text>
      </Box>

      {recordings.length > 0 ? (
        <Box>
          <Text {...text.label} mb={8}>
            EARLIER
          </Text>
          <Stack gap={0}>
            {recordings.map((recording, index) => (
              <Box key={recording.id}>
                {index > 0 ? <Divider /> : null}
                <Link
                  to={`/speech/${recording.id}`}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                  }}>
                  <Group align="center" wrap="nowrap" gap={12} py={11}>
                    <Box flex={1} miw={0}>
                      <Text {...text.displaySm}>{recording.title}</Text>
                      <Text {...text.meta} mt={2}>
                        {formatRecordingDate(recording.createdAt)} ·{" "}
                        {formatDuration(recording.durationSeconds)} ·{" "}
                        {formatSavedBadge(recording.savedWords)}
                      </Text>
                    </Box>
                    <IconChevronRight
                      size={15}
                      style={{ color: "rgba(0,0,0,.28)", flex: "none" }}
                    />
                  </Group>
                </Link>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
}
