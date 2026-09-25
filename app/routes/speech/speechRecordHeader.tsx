import { useNavigate } from "react-router";
import { Box, Group, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { text } from "../../theme/typography";
import { MAX_DURATION_SECONDS } from "./speechConstants";
import { formatDuration } from "./speechFormat";

interface SpeechRecordHeaderProps {
  isMaxShown?: boolean;
}

export function SpeechRecordHeader({
  isMaxShown = false,
}: SpeechRecordHeaderProps) {
  const navigate = useNavigate();

  return (
    <Box p="16px 16px 0">
      <Group justify="space-between" align="center" wrap="nowrap">
        <IconX
          size={22}
          onClick={() => void navigate("/speech")}
          style={{ color: "rgba(0,0,0,.45)", cursor: "pointer" }}
        />
        {isMaxShown ? (
          <Text {...text.meta} style={{ letterSpacing: ".6px" }}>
            MAX {formatDuration(MAX_DURATION_SECONDS)}
          </Text>
        ) : null}
      </Group>
    </Box>
  );
}
