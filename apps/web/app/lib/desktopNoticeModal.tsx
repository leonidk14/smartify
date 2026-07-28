import { useState } from "react";
import { Button, Modal, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconDeviceMobile } from "@tabler/icons-react";
import { text } from "../theme/typography";

const NOTICE_DISMISSED_KEY = "desktopNoticeDismissedAt";

function isNoticeDismissed(): boolean {
  try {
    return localStorage.getItem(NOTICE_DISMISSED_KEY) !== null;
  } catch {
    return false;
  }
}

function dismissNotice(): void {
  try {
    localStorage.setItem(NOTICE_DISMISSED_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable (private mode / disabled) — nothing to persist.
  }
}

export function DesktopNoticeModal() {
  // The explicit `false` keeps the modal shut on the first render — Mantine resolves the
  // real match in an effect, so without it the prerendered shell would flash it open.
  const isWideScreen = useMediaQuery("(min-width: 768px)", false);
  const [isDismissed, setIsDismissed] = useState(isNoticeDismissed);

  const handleDismiss = () => {
    dismissNotice();
    setIsDismissed(true);
  };

  return (
    <Modal
      opened={isWideScreen && !isDismissed}
      onClose={handleDismiss}
      centered
      size={400}
      radius={20}
      zIndex={400}
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.35 }}
      styles={{ body: { padding: "26px 24px 24px" } }}>
      <Stack gap={16}>
        <ThemeIcon size={44} radius={12} color="dark.9" variant="filled">
          <IconDeviceMobile size={22} />
        </ThemeIcon>

        <Stack gap={6}>
          <Title order={1}>Made for your phone</Title>
          <Text {...text.bodySm} c="dimmed">
            Smartify is built as a mobile app — it’s meant to live on a phone
            home screen and be used one-handed. You can keep going here, but
            some things won’t look or work quite right on a desktop screen.
          </Text>
        </Stack>

        <Button fullWidth size="md" radius={13} onClick={handleDismiss}>
          Got it
        </Button>
      </Stack>
    </Modal>
  );
}
