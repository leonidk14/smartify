import { useFetcher } from "react-router";
import { Box, Text } from "@mantine/core";
import { BottomSheet } from "../../lib/bottomSheet";
import { text } from "../../theme/typography";
import { REMOVE_INTENT } from "./keyActions";

interface RemoveKeySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RemoveKeySheet({ isOpen, onClose }: RemoveKeySheetProps) {
  const fetcher = useFetcher();
  const isRemoving = fetcher.state !== "idle";

  const handleRemove = async () => {
    await fetcher.submit({ intent: REMOVE_INTENT }, { method: "post" });
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      secondaryAction={{
        label: "Cancel",
        onClick: onClose,
        isDisabled: isRemoving,
      }}
      primaryAction={{
        label: "Remove key",
        onClick: () => void handleRemove(),
        isLoading: isRemoving,
      }}>
      <Box>
        <Text {...text.displayMd}>Remove this key?</Text>
        <Text {...text.bodySm} c="dimmed" mt={8}>
          Practice, Speech and lookups stop until you add another. Your words
          and history stay.
        </Text>
        <Text {...text.bodyXs} c="dimmed" mt={8}>
          The key still works at Anthropic. Revoke it in the console if you no
          longer need it.
        </Text>
      </Box>
    </BottomSheet>
  );
}
