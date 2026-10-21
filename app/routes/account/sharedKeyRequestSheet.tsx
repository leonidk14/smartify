import { useState } from "react";
import { useFetcher } from "react-router";
import { Box, Text, Textarea } from "@mantine/core";
import { useAuth } from "../../lib/authContext";
import { BottomSheet } from "../../lib/bottomSheet";
import { text, textCss } from "../../theme/typography";
import { SEND_ADMIN_KEY_REQUEST_INTENT } from "./keyActions";

const MAX_NOTE_CHARACTERS = 500;

interface SharedKeyRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SharedKeyRequestSheet({
  isOpen,
  onClose,
}: SharedKeyRequestSheetProps) {
  const { user } = useAuth();
  const fetcher = useFetcher();
  const [note, setNote] = useState("");

  const isSending = fetcher.state !== "idle";

  const handleSend = async () => {
    await fetcher.submit(
      { intent: SEND_ADMIN_KEY_REQUEST_INTENT, note },
      { method: "post" },
    );
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      secondaryAction={{
        label: "Cancel",
        onClick: onClose,
        isDisabled: isSending,
      }}
      primaryAction={{
        label: "Send request",
        onClick: () => void handleSend(),
        isLoading: isSending,
      }}>
      <Box>
        <Text {...text.displayMd}>Use the shared key</Text>
        <Text {...text.bodyXs} c="dimmed" mt={6}>
          The admin can let you run Practice, Speech and lookups on the app’s
          key. Usage is billed to them.
        </Text>
      </Box>

      <Textarea
        label="Note for the admin · optional"
        placeholder="e.g. Preparing for interviews this month"
        size="md"
        radius={11}
        autosize
        minRows={2}
        maxRows={4}
        maxLength={MAX_NOTE_CHARACTERS}
        value={note}
        onChange={(event) => setNote(event.currentTarget.value)}
        disabled={isSending}
        styles={{ label: { ...textCss.label, marginBottom: 8 } }}
      />

      {user?.email !== undefined ? (
        <Text {...text.label}>Sent as {user.email}</Text>
      ) : null}
    </BottomSheet>
  );
}
