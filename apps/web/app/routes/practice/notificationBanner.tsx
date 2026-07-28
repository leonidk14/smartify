import { useState } from "react";
import { Box, Button, Group, Paper, Text, ThemeIcon } from "@mantine/core";
import { IconBell } from "@tabler/icons-react";
import { useAuth } from "../../lib/auth";
import {
  dismissBanner,
  isBannerDismissed,
  isPushSupported,
  subscribeToPush,
} from "../../lib/push";
import { text } from "../../theme/typography";

export const NotificationBanner = () => {
  const { isSignedIn } = useAuth();
  const [isVisible, setIsVisible] = useState(
    () =>
      isPushSupported() &&
      // Show banner only when undecided: once a user has denied, Notification.requestPermission()
      // won't re-prompt — the browser returns "denied" immediately with no dialog
      // -> makes no sense to put it as "!== granted".
      Notification.permission === "default" &&
      !isBannerDismissed(),
  );
  const [isBusy, setIsBusy] = useState(false);

  if (!isVisible || !isSignedIn) {
    return null;
  }

  const handleEnable = async () => {
    setIsBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await subscribeToPush();
      }
      setIsVisible(false);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDismiss = () => {
    dismissBanner();
    setIsVisible(false);
  };

  return (
    <Paper
      radius={15}
      px={15}
      pt={15}
      pb={14}
      bg="var(--color-surface-info)"
      bd="1px solid var(--color-border-info)">
      <Group gap={12} wrap="nowrap" align="flex-start">
        <ThemeIcon size={34} radius={10} color="dark.9" variant="filled">
          <IconBell size={17} />
        </ThemeIcon>
        <Box flex={1} miw={0}>
          <Text {...text.uiLabel} c="dark.9">
            Get practice reminders
          </Text>
          <Text {...text.bodyXs} mt={3} c="rgba(0,0,0,.55)">
            We’ll nudge you when words are due and drop you straight into a
            session.
          </Text>
          <Group gap={12} align="center" mt={11} wrap="nowrap">
            <Button
              color="dark.9"
              radius={11}
              h={38}
              px={16}
              {...text.uiLabel}
              loading={isBusy}
              onClick={handleEnable}>
              Turn on reminders
            </Button>
            <Text
              {...text.metaLg}
              component="button"
              c="rgba(0,0,0,.4)"
              bg="transparent"
              bd="none"
              p={0}
              onClick={handleDismiss}
              style={{ cursor: "pointer" }}>
              Not now
            </Text>
          </Group>
        </Box>
      </Group>
    </Paper>
  );
};
