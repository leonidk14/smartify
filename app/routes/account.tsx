import { Link, Outlet, redirect, useLocation, useNavigate } from "react-router";
import axios from "axios";
import {
  ActionIcon,
  Box,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconChevronLeft } from "@tabler/icons-react";
import { text } from "../theme/typography";
import {
  accountTabFromPath,
  defaultAccountTab,
  hasBrokenKey,
} from "./account/accountTabs";
import { getLlmAccess } from "./account/llmAccessApi";
import type { Route } from "./+types/account";

export async function clientLoader() {
  try {
    return await getLlmAccess();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw redirect("/");
    }
    throw error;
  }
}

function AccountHeader() {
  return (
    <Group justify="space-between" wrap="nowrap">
      <ActionIcon
        component={Link}
        to="/"
        variant="subtle"
        color="gray"
        size="md"
        aria-label="Back">
        <IconChevronLeft size={22} />
      </ActionIcon>
      <Title order={1} {...text.displaySm}>
        Account
      </Title>
      <Box w={28} />
    </Group>
  );
}

export function ErrorBoundary() {
  return (
    <Stack gap={16} p={16}>
      <AccountHeader />
      <Text {...text.bodyXs} c="dimmed" ta="center" mt={40}>
        Couldn’t load your account — check your connection.
      </Text>
    </Stack>
  );
}

export default function AccountRoute({
  loaderData: access,
}: Route.ComponentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isKeyBroken = hasBrokenKey(access);
  const tab =
    accountTabFromPath(location.pathname) ?? defaultAccountTab(access);

  return (
    <Stack gap={16} p={16}>
      <AccountHeader />

      <SegmentedControl
        fullWidth
        radius={11}
        value={tab}
        onChange={(nextTab) =>
          void navigate(`/account/${nextTab}`, { replace: true })
        }
        styles={{ root: { background: "var(--color-surface-warm)" } }}
        data={[
          { value: "data", label: "Data" },
          {
            value: "key",
            label: (
              <Group gap={5} justify="center" wrap="nowrap">
                <span>Key</span>
                {isKeyBroken ? (
                  <Box
                    w={6}
                    h={6}
                    bdrs="50%"
                    bg="var(--color-text-error)"
                    role="img"
                    aria-label="Key not working"
                  />
                ) : null}
              </Group>
            ),
          },
        ]}
      />

      <Outlet />
    </Stack>
  );
}
