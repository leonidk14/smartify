import {
  ActionIcon,
  Box,
  Button,
  Drawer,
  Flex,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
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
    <Drawer
      opened={opened}
      onClose={onCancel}
      position="bottom"
      size={250}
      zIndex={400}
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.35 }}
      radius={0}
      styles={{
        content: { borderRadius: "24px 24px 0 0" },
        body: { padding: "14px 20px 24px" },
      }}>
      <Stack gap={16}>
        <Flex justify="flex-end">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            aria-label="Close"
            type="button"
            onClick={onCancel}>
            <IconX size={22} />
          </ActionIcon>
        </Flex>
        <Box>
          <Text {...text.headline}>Delete “{wordToDelete?.display}”?</Text>
          <Text {...text.bodySm} c="dimmed" mt={8}>
            This removes it from your vocabulary. You can always look it up
            again.
          </Text>
        </Box>
        <Group gap={10} wrap="nowrap">
          <Button
            variant="outline"
            color="dark"
            h={48}
            radius={12}
            flex={1}
            type="button"
            onClick={onCancel}
            disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="filled"
            color="red"
            h={48}
            radius={12}
            flex={1}
            type="button"
            onClick={() => void onConfirm()}
            loading={loading}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
}
