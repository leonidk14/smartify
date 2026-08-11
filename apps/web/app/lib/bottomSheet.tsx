import { ActionIcon, Button, Drawer, Flex, Group, Stack } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useKeyboardInset } from "./useKeyboardInset";

const BACKDROP_OPACITY = { dimmed: 0.35, readable: 0.05 };
const BODY_PADDING_BOTTOM = 12;

interface SheetAction {
  label: string;
  onClick: () => void;
  isDisabled?: boolean;
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  backdrop?: "dimmed" | "readable";
  hasCloseButton?: boolean;
  gap?: number;
  zIndex?: number;
  primaryAction?: SheetAction & {
    tone?: "default" | "danger";
    isLoading?: boolean;
  };
  secondaryAction?: SheetAction;
  children: React.ReactNode;
}

export const BottomSheet = ({
  isOpen,
  onClose,
  backdrop = "dimmed",
  hasCloseButton = false,
  gap = 16,
  zIndex = 300,
  primaryAction,
  secondaryAction,
  children,
}: BottomSheetProps) => {
  const keyboardInset = useKeyboardInset();

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="bottom"
      zIndex={zIndex}
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: BACKDROP_OPACITY[backdrop] }}
      radius={0}
      styles={{
        // Mantine drives a bottom drawer's height off its `size` prop; this
        // inline height outranks that rule so the sheet fits its content, and
        // the keyboard clearance comes from the body's bottom padding instead.
        content: { borderRadius: "24px 24px 0 0", height: "auto" },
        body: { padding: `14px 20px ${BODY_PADDING_BOTTOM + keyboardInset}px` },
      }}>
      <Stack gap={gap}>
        {hasCloseButton ? (
          <Flex justify="flex-end">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="md"
              aria-label="Close"
              type="button"
              onClick={onClose}>
              <IconX size={22} />
            </ActionIcon>
          </Flex>
        ) : null}
        {children}

        {primaryAction !== undefined || secondaryAction !== undefined ? (
          <Group gap={10} wrap="nowrap">
            {secondaryAction !== undefined ? (
              <Button
                variant="outline"
                color="dark"
                h={48}
                radius={12}
                flex={1}
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.isDisabled}>
                {secondaryAction.label}
              </Button>
            ) : null}
            {primaryAction !== undefined ? (
              <Button
                variant="filled"
                color={primaryAction.tone === "danger" ? "red" : "black"}
                h={48}
                radius={12}
                flex={1}
                onClick={primaryAction.onClick}
                disabled={primaryAction.isDisabled}
                loading={primaryAction.isLoading}>
                {primaryAction.label}
              </Button>
            ) : null}
          </Group>
        ) : null}
      </Stack>
    </Drawer>
  );
};
