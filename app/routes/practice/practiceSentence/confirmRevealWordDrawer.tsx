import { Box, Text } from "@mantine/core";
import { BottomSheet } from "~/lib/bottomSheet";
import { text } from "~/theme/typography";

export const ConfirmRevealWordDrawer = ({
  isOpen,
  onClose,
  onRevealWord,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRevealWord: () => void;
}) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      hasCloseButton
      secondaryAction={{ label: "Keep trying", onClick: onClose }}
      primaryAction={{ label: "Reveal the word", onClick: onRevealWord }}>
      <Box>
        <Text {...text.headline}>Reveal the whole word?</Text>
        <Text {...text.bodySm} c="dimmed" mt={8}>
          This forfeits scoring for this word — it won't count as correct or
          wrong in your summary.
        </Text>
      </Box>
    </BottomSheet>
  );
};
