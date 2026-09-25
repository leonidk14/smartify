import { Text } from "@mantine/core";
import { text } from "../../theme/typography";
import type { TranscriptSpan } from "./sharpenedTranscript";

const MARK_COLORS = {
  suggested: {
    background: "var(--color-surface-warning)",
    underline: "var(--color-warning)",
  },
  swapped: {
    background: "var(--color-surface-success)",
    underline: "var(--color-text-success)",
  },
};

interface MarkedTranscriptProps {
  spans: TranscriptSpan[];
  onSelectSuggestion: (suggestionId: string) => void;
}

export function MarkedTranscript({
  spans,
  onSelectSuggestion,
}: MarkedTranscriptProps) {
  return (
    <Text {...text.proseSm}>
      {spans.map((span, index) => {
        if (span.kind === "plain") {
          return (
            <Text key={index} span>
              {span.text}
            </Text>
          );
        }
        const { suggestionId } = span;
        const colors = MARK_COLORS[span.kind];
        return (
          <Text
            key={index}
            span
            data-testid={`transcript-mark-${suggestionId}`}
            onClick={() => onSelectSuggestion(suggestionId)}
            bg={colors.background}
            style={{
              borderBottom: `2px solid ${colors.underline}`,
              cursor: "pointer",
            }}>
            {span.text}
          </Text>
        );
      })}
    </Text>
  );
}
