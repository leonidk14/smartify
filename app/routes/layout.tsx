import { Outlet, useLocation, Link } from "react-router";
import { Box, Button, Flex, Group } from "@mantine/core";
import { IconArrowLeft, IconBrain, IconSearch } from "@tabler/icons-react";

export default function Layout() {
  const location = useLocation();
  const isSearch = location.pathname === "/";
  const isPracticeWord = /^\/practice\/.+/.test(location.pathname);

  return (
    <Flex direction="column" style={{ minHeight: "100vh" }}>
      <Box
        style={{
          borderBottom: "1px solid var(--mantine-color-gray-3)",
        }}>
        <Group
          justify={isPracticeWord ? "space-between" : "flex-end"}
          px={16}
          h={48}>
          {isPracticeWord && (
            <Button
              component={Link}
              to="/practice"
              variant="subtle"
              color="dark"
              leftSection={<IconArrowLeft size={18} />}>
              Back
            </Button>
          )}
          {isSearch ? (
            <Button
              component={Link}
              to="/practice"
              variant="subtle"
              color="dark"
              leftSection={<IconBrain size={18} />}>
              Practice
            </Button>
          ) : (
            <Button
              component={Link}
              to="/"
              variant="subtle"
              color="dark"
              leftSection={<IconSearch size={18} />}>
              Vocabulary
            </Button>
          )}
        </Group>
      </Box>
      <Flex direction="column" flex={1}>
        <Outlet />
      </Flex>
    </Flex>
  );
}
