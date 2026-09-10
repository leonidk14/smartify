import { Link } from "react-router";
import { Box, Divider, Flex, Group, Stack, Text, Title } from "@mantine/core";
import {
  IconChevronRight,
  IconKeyboard,
  IconMicrophone,
} from "@tabler/icons-react";
import { text } from "../../theme/typography";
import { MAX_DURATION_SECONDS } from "./speechConstants";
import {
  formatDuration,
  formatRecordingDate,
  formatSavedBadge,
} from "./speechFormat";
import type { SpeechRecording } from "./speechTypes";

interface SpeechListProps {
  recordings: SpeechRecording[];
}

interface CompactEntryButtonProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  caption: string;
}
function CompactEntryButton({
  to,
  icon,
  label,
  caption,
}: CompactEntryButtonProps) {
  return (
    <Flex
      component={Link}
      to={to}
      className="speech-entry-btn"
      direction="column"
      align="center"
      justify="center"
      gap={7}
      py={12}
      bdrs={13}
      td="none">
      {icon}
      <Text {...text.uiLabel} fz={13}>
        {label}
      </Text>
      <Text {...text.label} c={undefined} className="speech-entry-btn-caption">
        {caption}
      </Text>
    </Flex>
  );
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
        bd="1.5px dashed rgba(0,0,0,.16)"
        bdrs={15}
        p="17px 16px"
        bg="var(--color-surface-warm)">
        <Text {...text.displaySm} ta="center" mb={14}>
          Say it, or write it — then make it sharper
        </Text>
        <Group grow gap={10} wrap="nowrap">
          <CompactEntryButton
            to="/speech/record"
            icon={<IconMicrophone size={20} />}
            label="Record"
            caption={`UP TO ${formatDuration(MAX_DURATION_SECONDS)}`}
          />
          <CompactEntryButton
            to="/speech/type"
            icon={<IconKeyboard size={20} />}
            label="Type it"
            caption="PASTE OR WRITE"
          />
        </Group>
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
