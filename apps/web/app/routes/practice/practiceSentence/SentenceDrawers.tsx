import {
  ActionIcon,
  Button,
  Text,
  Drawer,
  Flex,
  Stack,
  Textarea,
  Box,
  Group,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useKeyboardInset } from "~/lib/useKeyboardInset";
import { text, textCss } from "~/theme/typography";

export const AnswerDrawer = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  value,
  evalError,
  onChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  value: string;
  evalError: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) => {
  const keyboardInset = useKeyboardInset();

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="bottom"
      size={260 + keyboardInset}
      zIndex={300}
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.35 }}
      radius={0}
      styles={{
        content: { borderRadius: "24px 24px 0 0" },
        body: { padding: "14px 20px 22px" },
      }}>
      <Stack gap={12}>
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
        <Textarea
          variant="unstyled"
          placeholder="Type your sentence…"
          autosize
          minRows={3}
          maxRows={5}
          value={value}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          enterKeyHint="send"
          disabled={isSubmitting}
          data-autofocus
          styles={{
            input: { padding: "14px 15px", ...textCss.body },
          }}
          bd="1.5px dashed rgba(0,0,0,.22)"
          bdrs={14}
        />
        {evalError ? (
          <Text {...text.bodySm} c="red">
            We couldn't grade that — please try again.
          </Text>
        ) : null}
        <Button
          fullWidth
          variant="filled"
          color="black"
          h={48}
          radius={12}
          onClick={onSubmit}
          loading={isSubmitting}
          disabled={!value.trim()}>
          Check
        </Button>
      </Stack>
    </Drawer>
  );
};

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
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="bottom"
      size={250}
      zIndex={300}
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
            onClick={onClose}>
            <IconX size={22} />
          </ActionIcon>
        </Flex>
        <Box>
          <Text {...text.headline}>Reveal the whole word?</Text>
          <Text {...text.bodySm} c="dimmed" mt={8}>
            This forfeits scoring for this word — it won't count as correct or
            wrong in your summary.
          </Text>
        </Box>
        <Group gap={10} wrap="nowrap">
          <Button
            variant="outline"
            color="dark"
            h={48}
            radius={12}
            flex={1}
            onClick={onClose}>
            Keep trying
          </Button>
          <Button
            variant="filled"
            color="black"
            h={48}
            radius={12}
            flex={1}
            onClick={onRevealWord}>
            Reveal the word
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
};
