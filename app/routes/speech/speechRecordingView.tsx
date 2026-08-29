import { useState } from "react";
import { useNavigate } from "react-router";
import { Box, Button, Group, Stack, Text } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { AnimatedAppMark } from "../../lib/animatedAppMark";
import { text } from "../../theme/typography";
import { ActionBar } from "../practice/actionBar";
import { MarkedTranscript } from "./markedTranscript";
import { SuggestionSheet } from "./suggestionSheet";
import type { SpeechRecording } from "./speechTypes";

interface SpeechRecordingViewProps {
  recording: SpeechRecording;
}

const SAVE_STUB_DELAY_MS = 900;
// Above the layout header (a static, non-positioned Box) — position:fixed
// alone already paints above static content regardless of z-index or DOM
// order, this just makes the intent explicit.
const OVERLAY_Z_INDEX = 100;

export function SpeechRecordingView({ recording }: SpeechRecordingViewProps) {
  const navigate = useNavigate();
  const [openSuggestionId, setOpenSuggestionId] = useState<string | null>(null);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(
    () => new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleWord = (vocabularyWord: string) => {
    setSelectedWords((prev) => {
      const next = new Set(prev);
      if (next.has(vocabularyWord)) {
        next.delete(vocabularyWord);
      } else {
        next.add(vocabularyWord);
      }
      return next;
    });
  };

  const handleSave = () => {
    // TODO(speech): real save in stage 1b — lookupWord/saveWord/setPracticeLater
    // per selected word, then markSavedWords for this recording.
    setIsSaving(true);
    window.setTimeout(() => void navigate("/"), SAVE_STUB_DELAY_MS);
  };

  if (isSaving) {
    const count = selectedWords.size;
    return (
      <Box pos="fixed" inset={0} style={{ zIndex: OVERLAY_Z_INDEX }}>
        <AnimatedAppMark
          caption={`Saving ${count} ${count === 1 ? "word" : "words"}…`}
        />
      </Box>
    );
  }

  const openSuggestion =
    recording.suggestions.find((s) => s.id === openSuggestionId) ?? null;
  const hasSuggestions = recording.suggestions.length > 0;

  return (
    <>
      <Box p={16} pb={110} flex={1}>
        <Stack gap={15}>
          <Box>
            <Text {...text.label} mb={7}>
              WHAT YOU SAID
            </Text>
            <MarkedTranscript
              segments={recording.segments}
              onSelectSuggestion={setOpenSuggestionId}
            />
          </Box>

          {hasSuggestions ? (
            <Box>
              <Text {...text.label} mb={6}>
                {recording.suggestions.length} PLACES TO SHARPEN
              </Text>
              <Stack gap={0}>
                {recording.suggestions.map((suggestion) => {
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
                      onClick={() => setOpenSuggestionId(suggestion.id)}
                      style={{
                        borderBottom: "1px solid rgba(0,0,0,.07)",
                        cursor: "pointer",
                      }}>
                      <Box flex={1} miw={0}>
                        <Text {...text.bodyXs} c="dimmed">
                          {suggestion.original}
                        </Text>
                        <Text {...text.displaySm} mt={3}>
                          {firstAlternative?.phrase}
                          {rest.length > 0 ? (
                            <Text {...text.meta} span ml={6}>
                              +{rest.length} more
                            </Text>
                          ) : null}
                        </Text>
                      </Box>
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
          <Button
            fullWidth
            h={50}
            radius={13}
            color="black"
            disabled={selectedWords.size === 0}
            onClick={handleSave}>
            Save {selectedWords.size}{" "}
            {selectedWords.size === 1 ? "phrase" : "phrases"} to practise
          </Button>
        </ActionBar>
      ) : null}

      <SuggestionSheet
        suggestion={openSuggestion}
        selectedWords={selectedWords}
        onToggleWord={toggleWord}
        onClose={() => setOpenSuggestionId(null)}
      />
    </>
  );
}
