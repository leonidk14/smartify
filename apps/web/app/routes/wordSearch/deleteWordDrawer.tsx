import { Box, Text } from "@mantine/core";
import { BottomSheet } from "../../lib/bottomSheet";
import { text } from "../../theme/typography";

interface DeleteWordDrawerProps {
  wordToDelete: { key: string | null; display: string | null } | null;
  opened: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteWordDrawer({
  wordToDelete,
  opened,
  loading,
  onCancel,
  onConfirm,
}: DeleteWordDrawerProps) {
  return (
    <BottomSheet
      isOpen={opened}
      onClose={onCancel}
      hasCloseButton
      zIndex={400}
      secondaryAction={{
        label: "Cancel",
        onClick: onCancel,
        isDisabled: loading,
      }}
      primaryAction={{
        label: "Delete",
        onClick: () => void onConfirm(),
        tone: "danger",
        isLoading: loading,
      }}>
      <Box>
        <Text {...text.headline}>Delete “{wordToDelete?.display}”?</Text>
        <Text {...text.bodySm} c="dimmed" mt={8}>
          This removes it from your vocabulary. You can always look it up again.
        </Text>
      </Box>
    </BottomSheet>
  );
}
