import { useState } from "react";
import { Box, Button, Group, Stack, Text } from "@mantine/core";
import { IconCheck, IconChevronRight } from "@tabler/icons-react";
import { text } from "../../theme/typography";
import { ActionBar } from "../practice/actionBar";
import { MarkedTranscript } from "./markedTranscript";
import { sharpenTranscript } from "./sharpenedTranscript";
import { SuggestionSheet } from "./suggestionSheet";
import type { SpeechEntry } from "./speechApi";
import type { ChosenAlternatives } from "./speechTypes";

interface SpeechRecordingViewProps {
  recording: SpeechEntry;
}

interface SheetState {
  suggestionId: string;
  alternativeIndex: number;
  isOpen: boolean;
}

export function SpeechRecordingView({ recording }: SpeechRecordingViewProps) {
  const [chosenAlternatives, setChosenAlternatives] =
    useState<ChosenAlternatives>(recording.chosenAlternatives);
  const [sheet, setSheet] = useState<SheetState | null>(null);

  const { spans, keepRows } = sharpenTranscript({
    segments: recording.segments,
    suggestions: recording.suggestions,
    chosenAlternatives,
  });

  const openSheet = (suggestionId: string) => {
    setSheet({
      suggestionId,
      alternativeIndex: chosenAlternatives[suggestionId] ?? 0,
      isOpen: true,
    });
  };

  const closeSheet = () => {
    setSheet((prev) => (prev === null ? null : { ...prev, isOpen: false }));
  };

  const selectAlternative = (alternativeIndex: number) => {
    setSheet((prev) => (prev === null ? null : { ...prev, alternativeIndex }));
  };

  const swapIn = () => {
    if (sheet === null) {
      return;
    }
    const { suggestionId, alternativeIndex } = sheet;
    setChosenAlternatives((prev) => ({
      ...prev,
      [suggestionId]: alternativeIndex,
    }));
    closeSheet();
  };

  const keepOriginal = () => {
    if (sheet === null) {
      return;
    }
    const { suggestionId } = sheet;
    setChosenAlternatives((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(([id]) => id !== suggestionId),
      ),
    );
    closeSheet();
  };

  const sheetSuggestion =
    sheet === null
      ? null
      : (recording.suggestions.find(({ id }) => id === sheet.suggestionId) ??
        null);
  const hasSuggestions = recording.suggestions.length > 0;

  return (
    <>
      <Box p={16} pb={110} flex={1}>
        <Stack gap={15}>
          <Box>
            <Text {...text.label} mb={7}>
              WHAT YOU SAID
            </Text>
            <MarkedTranscript spans={spans} onSelectSuggestion={openSheet} />
          </Box>

          {hasSuggestions ? (
            <Box>
              <Text {...text.label} mb={6}>
                {recording.suggestions.length} PLACES TO SHARPEN
              </Text>
              <Stack gap={0}>
                {recording.suggestions.map((suggestion) => {
                  const swapped = keepRows.find(
                    ({ suggestionId }) => suggestionId === suggestion.id,
                  );
                  const [firstAlternative, ...rest] = suggestion.alternatives;
                  return (
                    <Group
                      key={suggestion.id}
                      data-testid={`suggestion-row-${suggestion.id}`}
                      justify="space-between"
                      align="center"
                      wrap="nowrap"
                      gap={11}
                      py={11}
                      onClick={() => openSheet(suggestion.id)}
                      style={{
                        borderBottom: "1px solid rgba(0,0,0,.07)",
                        cursor: "pointer",
                      }}>
                      <Box flex={1} miw={0}>
                        <Text {...text.bodyXs} c="dimmed">
                          {suggestion.original}
                        </Text>
                        <Text {...text.displaySm} mt={3}>
                          {swapped?.phrase ?? firstAlternative?.phrase}
                          {rest.length > 0 ? (
                            <Text {...text.meta} span ml={6}>
                              +{rest.length} more
                            </Text>
                          ) : null}
                        </Text>
                      </Box>
                      {swapped ? (
                        <IconCheck
                          size={15}
                          style={{
                            color: "var(--color-text-success)",
                            flex: "none",
                          }}
                        />
                      ) : null}
                      <IconChevronRight
                        size={15}
                        style={{ color: "rgba(0,0,0,.28)", flex: "none" }}
                      />
                    </Group>
                  );
                })}
              </Stack>
            </Box>
          ) : (
            <Text {...text.bodySm} c="dimmed">
              Nothing to sharpen here — this one already sounds good.
            </Text>
          )}
        </Stack>
      </Box>

      {hasSuggestions ? (
        <ActionBar>
          {/* TODO(speech): #07 — open /speech/:id/keep with the swaps. */}
          <Button fullWidth h={50} radius={13} color="black" disabled>
            Continue
          </Button>
        </ActionBar>
      ) : null}

      <SuggestionSheet
        isOpen={sheet?.isOpen ?? false}
        suggestion={sheetSuggestion}
        selectedIndex={sheet?.alternativeIndex ?? 0}
        onSelect={selectAlternative}
        onSwapIn={swapIn}
        onKeepOriginal={keepOriginal}
        onClose={closeSheet}
      />
    </>
  );
}
