import { Text } from "@mantine/core";
import { text } from "../../theme/typography";
import type { TranscriptSegment } from "./speechTypes";

interface MarkedTranscriptProps {
  segments: TranscriptSegment[];
  onSelectSuggestion: (suggestionId: string) => void;
}

export function MarkedTranscript({
  segments,
  onSelectSuggestion,
}: MarkedTranscriptProps) {
  return (
    <Text {...text.proseSm}>
      {segments.map((segment, index) => {
        const suggestionId = segment.suggestionId;
        if (suggestionId === null) {
          return (
            <Text key={index} span>
              {segment.text}
            </Text>
          );
        }
        return (
          <Text
            key={index}
            span
            data-testid={`transcript-mark-${suggestionId}`}
            onClick={() => onSelectSuggestion(suggestionId)}
            bg="var(--color-surface-warning)"
            style={{
              borderBottom: "2px solid var(--color-warning)",
              cursor: "pointer",
            }}>
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
}
