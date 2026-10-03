import { Suspense } from "react";
import { Await, Link } from "react-router";
import {
  Box,
  Divider,
  Flex,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconChevronRight,
  IconKeyboard,
  IconMicrophone,
} from "@tabler/icons-react";
import { text } from "../../theme/typography";
import { MAX_DURATION_SECONDS } from "./speechConstants";
import {
  formatDuration,
  formatRecordingCount,
  formatRecordingDate,
  formatWordCount,
} from "./speechFormat";
import type { SpeechEntrySummary } from "./speechApi";

const COUNT_LINE_PLACEHOLDER = " ";

interface SpeechListProps {
  recordings: Promise<SpeechEntrySummary[]>;
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

function RecordingsLoading() {
  return (
    <Stack gap={0}>
      <Group flex={1} gap={12} py={11}>
        <Skeleton height={24} radius="xl" />
        <Skeleton height={12} mt={2} radius="xl" />
      </Group>
      <Divider />
      <Group flex={1} gap={12} py={11}>
        <Skeleton height={24} radius="xl" />
        <Skeleton height={12} mt={2} radius="xl" />
      </Group>
      <Divider />
      <Group flex={1} gap={12} py={11}>
        <Skeleton height={24} radius="xl" />
        <Skeleton height={12} mt={2} radius="xl" />
      </Group>
    </Stack>
  );
}

function RecordingsLoadError() {
  return (
    <Text {...text.bodyXs} c="dimmed" ta="center" py={16}>
      Couldn&apos;t load your recordings — check your connection.
    </Text>
  );
}

interface EarlierRecordingsProps {
  recordings: SpeechEntrySummary[];
}
function EarlierRecordings({ recordings }: EarlierRecordingsProps) {
  if (recordings.length === 0) {
    return null;
  }

  return (
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
                  {recording.durationSeconds !== null
                    ? formatDuration(recording.durationSeconds)
                    : formatWordCount(recording.wordCount)}
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
  );
}

export function SpeechList({ recordings }: SpeechListProps) {
  return (
    <Stack gap={18} p={20} pb={96}>
      <Box>
        <Title order={1}>Speech</Title>
        <Text {...text.meta} mt={5}>
          <Suspense fallback={COUNT_LINE_PLACEHOLDER}>
            <Await resolve={recordings} errorElement={COUNT_LINE_PLACEHOLDER}>
              {(loaded) => formatRecordingCount(loaded.length)}
            </Await>
          </Suspense>
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

      <Box>
        <Text {...text.label} mt={12}>
          EARLIER
        </Text>
        <Suspense fallback={<RecordingsLoading />}>
          <Await resolve={recordings} errorElement={<RecordingsLoadError />}>
            {(loaded) => <EarlierRecordings recordings={loaded} />}
          </Await>
        </Suspense>
      </Box>
    </Stack>
  );
}
