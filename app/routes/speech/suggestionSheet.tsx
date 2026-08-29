import { useState } from "react";
import { Box, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { BottomSheet } from "../../lib/bottomSheet";
import { text } from "../../theme/typography";
import type { SpeechSuggestion } from "./speechTypes";

interface SuggestionSheetProps {
  suggestion: SpeechSuggestion | null;
  selectedWords: Set<string>;
  onToggleWord: (vocabularyWord: string) => void;
  onClose: () => void;
}

export function SuggestionSheet({
  suggestion,
  selectedWords,
  onToggleWord,
  onClose,
}: SuggestionSheetProps) {
  // The sheet's content must survive its own close animation, so the last
  // suggestion shown is kept around rather than disappearing the instant
  // `suggestion` goes back to null. Adjusted during render rather than in an
  // effect, per https://react.dev/learn/you-might-not-need-an-effect.
  const [lastSuggestion, setLastSuggestion] = useState<SpeechSuggestion | null>(
    null,
  );
  if (suggestion !== null && suggestion !== lastSuggestion) {
    setLastSuggestion(suggestion);
  }

  const shown = suggestion ?? lastSuggestion;

  return (
    <BottomSheet
      isOpen={suggestion !== null}
      onClose={onClose}
      primaryAction={{ label: "Done", onClick: onClose }}>
      {shown ? (
        <Stack gap={18}>
          <Box>
            <Text {...text.label}>YOU SAID</Text>
            <Text {...text.displayMd} c="dimmed" mt={5}>
              {shown.original}
            </Text>
          </Box>

          <Stack gap={9}>
            {shown.alternatives.map((alternative) => {
              const isSelected = selectedWords.has(alternative.vocabularyWord);
              return (
                <Group
                  key={alternative.vocabularyWord}
                  align="flex-start"
                  gap={12}
                  wrap="nowrap"
                  onClick={() => onToggleWord(alternative.vocabularyWord)}
                  p={14}
                  bdrs={14}
                  bd={
                    isSelected
                      ? "1.5px solid var(--color-text)"
                      : "1.5px solid rgba(0,0,0,.14)"
                  }
                  style={{ cursor: "pointer" }}>
                  <Box flex={1} miw={0}>
                    <Group gap={8} align="baseline" wrap="nowrap">
                      <Text {...text.displaySm}>{alternative.phrase}</Text>
                      <Text {...text.label}>{alternative.register}</Text>
                    </Group>
                    <Text
                      mt={5}
                      ff="var(--font-family-serif)"
                      fz={14}
                      lh={1.5}
                      c="dimmed">
                      “{alternative.inSentence}”
                    </Text>
                  </Box>
                  <ThemeIcon
                    size={22}
                    radius={6}
                    mt={2}
                    variant={isSelected ? "filled" : "outline"}
                    color={isSelected ? "dark" : "gray"}>
                    {isSelected ? <IconCheck size={12} /> : <span />}
                  </ThemeIcon>
                </Group>
              );
            })}
          </Stack>
        </Stack>
      ) : null}
    </BottomSheet>
  );
}
