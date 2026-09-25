import { useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconChevronLeft } from "@tabler/icons-react";
import { AnimatedAppMark } from "../../lib/animatedAppMark";
import { text } from "../../theme/typography";
import { ActionBar } from "../practice/actionBar";
import type { KeepSaveFailure } from "./keptWords";
import { sharpenTranscript } from "./sharpenedTranscript";
import { finishSpeechReview, type SpeechEntry } from "./speechApi";
import { formatWordCount } from "./speechFormat";
import type { ChosenAlternatives } from "./speechTypes";

interface SpeechKeepViewProps {
  recording: SpeechEntry;
  chosenAlternatives: ChosenAlternatives;
}

export function SpeechKeepView({
  recording,
  chosenAlternatives,
}: SpeechKeepViewProps) {
  const navigate = useNavigate();
  const saveFetcher = useFetcher<KeepSaveFailure>();
  const { keepRows } = sharpenTranscript({
    segments: recording.segments,
    suggestions: recording.suggestions,
    chosenAlternatives,
  });
  const [tickedIds, setTickedIds] = useState(() =>
    keepRows.map(({ suggestionId }) => suggestionId),
  );
  const [isFinishing, setIsFinishing] = useState(false);

  const hasRows = keepRows.length > 0;
  const tickedRows = keepRows.filter(({ suggestionId }) =>
    tickedIds.includes(suggestionId),
  );
  const isSaving = saveFetcher.state !== "idle";
  const saveFailure = saveFetcher.data;
  const failedWords =
    saveFailure?.reason === "words" ? saveFailure.failedWords : [];

  const saveTicked = () => {
    void saveFetcher.submit(
      {
        words: tickedRows.map(({ vocabularyWord }) => vocabularyWord),
        chosenAlternatives,
      },
      {
        method: "post",
        action: `/speech/${recording.id}/keep`,
        encType: "application/json",
      },
    );
  };

  const finishWithoutSaving = async () => {
    setIsFinishing(true);
    try {
      await finishSpeechReview({ id: recording.id, chosenAlternatives });
    } catch (error) {
      console.error("Failed to finish speech review", error);
      notifications.show({
        color: "red",
        message: "Couldn’t finish this review. Please try again.",
      });
      setIsFinishing(false);
      return;
    }
    void navigate("/speech", { replace: true });
  };

  if (isSaving) {
    return (
      <AnimatedAppMark
        caption={`Saving ${formatWordCount(tickedRows.length)}…`}
      />
    );
  }

  return (
    <>
      <Box p="16px 16px 0">
        <Group gap={6} align="center" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            aria-label="Back to review"
            onClick={() => void navigate(-1)}>
            <IconChevronLeft size={20} />
          </ActionIcon>
          <Text {...text.displayMd}>Keep for practice</Text>
        </Group>
      </Box>

      <Box p={16} pb={110} flex={1}>
        {hasRows ? (
          <>
            <Text {...text.bodyXs} c="dimmed" mb={6}>
              Ticked words go into your vocabulary, marked for practice.
            </Text>
            <Checkbox.Group value={tickedIds} onChange={setTickedIds}>
              <Stack gap={0}>
                {keepRows.map((row) => (
                  <Checkbox.Card
                    key={row.suggestionId}
                    value={row.suggestionId}
                    withBorder={false}
                    radius={0}
                    py={12}
                    ta="left"
                    style={{ borderBottom: "1px solid rgba(0,0,0,.07)" }}>
                    <Group align="flex-start" gap={12} wrap="nowrap">
                      <Checkbox.Indicator mt={2} />
                      <Box flex={1} miw={0}>
                        <Text {...text.displaySm}>{row.phrase}</Text>
                        <Text {...text.bodyXs} c="dimmed" mt={3}>
                          instead of “{row.replaced}”
                        </Text>
                        {failedWords.includes(row.vocabularyWord) ? (
                          <Text
                            {...text.bodyXs}
                            c="var(--color-text-error)"
                            mt={3}>
                            Couldn’t save “{row.vocabularyWord}”
                          </Text>
                        ) : null}
                      </Box>
                    </Group>
                  </Checkbox.Card>
                ))}
              </Stack>
            </Checkbox.Group>
            {saveFailure ? (
              <Text {...text.bodySm} c="var(--color-text-error)" mt={14}>
                {saveFailure.reason === "words"
                  ? "Try again, or untick the words that failed to finish without them."
                  : "Your words are saved, but the review couldn’t be finished. Please try again."}
              </Text>
            ) : null}
          </>
        ) : (
          <Text {...text.bodySm} c="dimmed">
            You kept your own wording everywhere, so there’s nothing to add.
          </Text>
        )}
      </Box>

      <ActionBar>
        <Group gap={10} wrap="nowrap">
          <Button
            variant="outline"
            color="dark"
            h={50}
            radius={13}
            flex={hasRows ? undefined : 1}
            loading={isFinishing}
            onClick={() => void finishWithoutSaving()}>
            Not this time
          </Button>
          {hasRows ? (
            <Button
              variant="filled"
              color="black"
              h={50}
              radius={13}
              flex={1}
              disabled={tickedRows.length === 0 || isFinishing}
              onClick={saveTicked}>
              Save {formatWordCount(tickedRows.length)}
            </Button>
          ) : null}
        </Group>
      </ActionBar>
    </>
  );
}
