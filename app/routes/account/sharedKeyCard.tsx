import { useFetcher } from "react-router";
import { Button, Divider, Group, Paper, Stack, Text } from "@mantine/core";
import { text } from "../../theme/typography";
import { formatEventTime } from "./formatDate";
import { CANCEL_ADMIN_KEY_REQUEST_INTENT } from "./keyActions";
import type { AdminKeyRequest } from "./llmAccessApi";

interface SharedKeyFrameProps {
  status: string;
  statusColor: string;
  borderColor?: string;
  children: React.ReactNode;
}

function SharedKeyFrame({
  status,
  statusColor,
  borderColor = "rgba(0,0,0,.12)",
  children,
}: SharedKeyFrameProps) {
  return (
    <Paper radius={15} p={15} bd={`1.5px solid ${borderColor}`}>
      <Stack gap={11}>
        <Group justify="space-between" wrap="nowrap">
          <Text {...text.uiLabel}>Shared key</Text>
          <Text {...text.label} c={statusColor}>
            ● {status}
          </Text>
        </Group>
        {children}
      </Stack>
    </Paper>
  );
}

interface SharedKeyRequestCardProps {
  request: AdminKeyRequest;
}

export function SharedKeyPendingCard({ request }: SharedKeyRequestCardProps) {
  const fetcher = useFetcher();
  const isCancelling = fetcher.state !== "idle";

  const handleCancel = () => {
    void fetcher.submit(
      { intent: CANCEL_ADMIN_KEY_REQUEST_INTENT },
      { method: "post" },
    );
  };

  return (
    <SharedKeyFrame status="Pending" statusColor="dimmed">
      <Text {...text.bodyXs} c="dimmed">
        Request sent to the admin. Check back here for their answer.
      </Text>
      <Text {...text.label}>Sent {formatEventTime(request.sentAt)}</Text>
      <Button
        variant="outline"
        color="dark"
        h={38}
        radius={13}
        loading={isCancelling}
        onClick={handleCancel}>
        Cancel request
      </Button>
    </SharedKeyFrame>
  );
}

interface SharedKeyGrantedCardProps {
  grantedAt: string | null;
}

export function SharedKeyGrantedCard({ grantedAt }: SharedKeyGrantedCardProps) {
  return (
    <SharedKeyFrame status="Granted" statusColor="var(--color-text-success)">
      <Text {...text.bodyXs} c="dimmed">
        Practice, Speech and lookups run on the app’s key.
      </Text>
      {grantedAt !== null ? (
        <Text {...text.label}>Granted {formatEventTime(grantedAt)}</Text>
      ) : null}
    </SharedKeyFrame>
  );
}

export function SharedKeyDeclinedCard({ request }: SharedKeyRequestCardProps) {
  return (
    <SharedKeyFrame
      status="Declined"
      statusColor="var(--color-text-error)"
      borderColor="var(--color-text-error)">
      <Text {...text.bodyXs}>The admin declined your request.</Text>
      {request.reason !== null ? (
        <Text
          {...text.bodyXs}
          fs="italic"
          bg="var(--color-surface-warm)"
          bdrs={9}
          px={12}
          py={10}>
          “{request.reason}”
        </Text>
      ) : null}
      {request.resolvedAt !== null ? (
        <Text {...text.label}>
          Declined {formatEventTime(request.resolvedAt)}
        </Text>
      ) : null}
    </SharedKeyFrame>
  );
}

export function OwnKeyDivider() {
  return (
    <Divider
      labelPosition="center"
      label={<Text {...text.label}>Or use your own key</Text>}
    />
  );
}
