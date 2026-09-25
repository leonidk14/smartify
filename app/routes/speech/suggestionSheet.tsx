import { Box, Flex, Group, Radio, Stack, Text } from "@mantine/core";
import { BottomSheet } from "../../lib/bottomSheet";
import { text } from "../../theme/typography";
import type { SpeechSuggestion } from "./speechTypes";

interface SuggestionSheetProps {
  isOpen: boolean;
  suggestion: SpeechSuggestion | null;
  selectedIndex: number;
  onSelect: (alternativeIndex: number) => void;
  onSwapIn: () => void;
  onKeepOriginal: () => void;
  onClose: () => void;
}

export function SuggestionSheet({
  isOpen,
  suggestion,
  selectedIndex,
  onSelect,
  onSwapIn,
  onKeepOriginal,
  onClose,
}: SuggestionSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      secondaryAction={{ label: "Keep mine", onClick: onKeepOriginal }}
      primaryAction={{ label: "Use this one", onClick: onSwapIn }}>
      {suggestion ? (
        <Stack gap={18}>
          <Box>
            <Text {...text.label}>YOU SAID</Text>
            <Text {...text.displayMd} c="dimmed" mt={5}>
              {suggestion.original}
            </Text>
          </Box>

          <Radio.Group
            value={String(selectedIndex)}
            onChange={(value) => onSelect(Number(value))}>
            <Stack gap={9}>
              {suggestion.alternatives.map((alternative, index) => (
                <Radio.Card
                  key={alternative.phrase}
                  value={String(index)}
                  withBorder={false}
                  radius={14}
                  p={14}
                  ta="left"
                  bd={
                    index === selectedIndex
                      ? "1.5px solid var(--color-text)"
                      : "1.5px solid rgba(0,0,0,.14)"
                  }>
                  <Group align="flex-start" gap={12} wrap="nowrap">
                    <Box flex={1} miw={0}>
                      <Flex
                        columnGap={8}
                        rowGap={2}
                        align="baseline"
                        wrap="wrap">
                        <Text {...text.displaySm}>{alternative.phrase}</Text>
                        <Text {...text.label}>{alternative.register}</Text>
                      </Flex>
                      <Text
                        mt={5}
                        ff="var(--font-family-serif)"
                        fz={14}
                        lh={1.5}
                        c="dimmed">
                        “{alternative.inSentence}”
                      </Text>
                    </Box>
                    <Radio.Indicator mt={2} />
                  </Group>
                </Radio.Card>
              ))}
            </Stack>
          </Radio.Group>
        </Stack>
      ) : null}
    </BottomSheet>
  );
}
