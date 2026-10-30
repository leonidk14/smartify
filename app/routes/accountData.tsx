import { useNavigate } from "react-router";
import { Box, Button, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLogout } from "@tabler/icons-react";
import { useAuth } from "../lib/authContext";
import { text } from "../theme/typography";
import { RemindersSetting } from "./account/remindersSetting";

export default function AccountDataRoute() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    notifications.show({ message: "Signed out" });
    void navigate("/", { replace: true });
  };

  return (
    <Stack gap={20}>
      <Box>
        <Text {...text.label}>Email</Text>
        <Text {...text.body} mt={4}>
          {user?.email}
        </Text>
      </Box>
      <RemindersSetting />
      <Button
        variant="outline"
        color="dark"
        h={48}
        radius={13}
        leftSection={<IconLogout size={16} />}
        onClick={() => void handleSignOut()}>
        Sign out
      </Button>
    </Stack>
  );
}
