import { useState } from "react";
import { Box, Button, Group, Paper, Text, ThemeIcon } from "@mantine/core";
import { IconBell } from "@tabler/icons-react";
import { useAuth } from "../../lib/authContext";
import {
  dismissBanner,
  enableReminders,
  isBannerDismissed,
  isBannerRefused,
  isPushSupported,
  refuseBanner,
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
      !isBannerDismissed() &&
      !isBannerRefused(),
  );
  const [isBusy, setIsBusy] = useState(false);

  if (!isVisible || !isSignedIn) {
    return null;
  }

  const handleEnable = async () => {
    setIsBusy(true);
    try {
      await enableReminders();
      setIsVisible(false);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDismiss = () => {
    dismissBanner();
    setIsVisible(false);
  };

  const handleRefuse = () => {
    refuseBanner();
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
          <Button
            color="dark.9"
            radius={11}
            h={38}
            px={16}
            mt={11}
            {...text.uiLabel}
            loading={isBusy}
            onClick={() => void handleEnable()}>
            Turn on reminders
          </Button>
          <Group gap={16} align="center" mt={11} wrap="nowrap">
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
            <Text
              {...text.metaLg}
              component="button"
              c="rgba(0,0,0,.4)"
              bg="transparent"
              bd="none"
              p={0}
              onClick={handleRefuse}
              style={{ cursor: "pointer" }}>
              Don’t ask again
            </Text>
          </Group>
        </Box>
      </Group>
    </Paper>
  );
};
