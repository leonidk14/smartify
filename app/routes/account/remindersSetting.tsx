import { useEffect, useState } from "react";
import { Box, Button, Text } from "@mantine/core";
import { IconBell } from "@tabler/icons-react";
import {
  enableReminders,
  getReminderStatus,
  type ReminderStatus,
} from "../../lib/push";
import { text } from "../../theme/typography";

export function RemindersSetting() {
  const [status, setStatus] = useState<ReminderStatus | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    void getReminderStatus().then(setStatus);
  }, []);

  if (status === null || status === "unsupported") {
    return null;
  }

  const handleEnable = async () => {
    setIsBusy(true);
    try {
      await enableReminders();
      setStatus(await getReminderStatus());
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Box>
      <Text {...text.label}>Reminders</Text>
      {status === "on" ? (
        <Text {...text.body} mt={4}>
          On for this device
        </Text>
      ) : null}
      {status === "blocked" ? (
        <Text {...text.body} mt={4}>
          Blocked. Turn on notifications for this app in your device settings.
        </Text>
      ) : null}
      {status === "off" ? (
        <Button
          variant="outline"
          color="dark"
          fullWidth
          h={48}
          mt={8}
          radius={13}
          leftSection={<IconBell size={16} />}
          loading={isBusy}
          onClick={() => void handleEnable()}>
          Turn on reminders
        </Button>
      ) : null}
    </Box>
  );
}
