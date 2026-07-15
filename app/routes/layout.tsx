import { useEffect } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useNavigation,
  Link,
} from "react-router";
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  Loader,
  SegmentedControl,
  Text,
} from "@mantine/core";
import { IconBook, IconChevronLeft, IconPlayerPlay } from "@tabler/icons-react";
import { monoLabel } from "./wordSearch/typography";

const MODE_LABELS: Record<string, string> = {
  word: "Guess the word",
  sentence: "Rebuild the sentence",
  both: "Guess & rebuild",
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_NAVIGATE" && event.data.url) {
        navigate(event.data.url);
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);

  const isHome = location.pathname === "/";
  const isPracticeLanding = location.pathname === "/practice";
  const isTopLevelScreen = isHome || isPracticeLanding;

  const isSelectScreen = location.pathname === "/practice/select";
  const selectMode = new URLSearchParams(location.search).get("mode") ?? "both";

  const isLoadingSentence =
    navigation.state === "loading" &&
    !!navigation.location &&
    /^\/practice\/[^/]+\/sentence$/.test(navigation.location.pathname);

  return (
    <Flex direction="column" style={{ minHeight: "100vh" }}>
      {isSelectScreen ? (
        <Box p={16} pb={12}>
          <Group gap={10} align="center" wrap="nowrap">
            <ActionIcon
              component={Link}
              to="/practice"
              variant="subtle"
              color="gray"
              size="md"
              aria-label="Back">
              <IconChevronLeft size={22} />
            </ActionIcon>
            <Box>
              <Text {...monoLabel}>{MODE_LABELS[selectMode]}</Text>
              <Text
                className="serif"
                mt={2}
                style={{ fontSize: 20, lineHeight: 1.1 }}>
                Which words?
              </Text>
            </Box>
          </Group>
        </Box>
      ) : null}

      <Flex
        direction="column"
        flex={1}
        style={{ position: "relative" }}
        pb={isTopLevelScreen ? 80 : undefined}>
        <Outlet />
        {isLoadingSentence && (
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap={16}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 100,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(2px)",
            }}>
            <Loader color="dark" size="lg" />
            <Text size="md" c="dimmed">
              Building your sentence…
            </Text>
          </Flex>
        )}
      </Flex>

      {isTopLevelScreen && (
        <Box
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "8px 16px 16px",
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0), #fff 12px)",
          }}>
          <SegmentedControl
            fullWidth
            radius={12}
            color="ink"
            value={isHome ? "/" : "/practice"}
            onChange={(value) => navigate(value)}
            styles={{ root: { background: "var(--surface-warm)" } }}
            data={[
              {
                value: "/",
                label: (
                  <Group gap={7} justify="center" wrap="nowrap">
                    <IconBook size={16} />
                    <span>Words</span>
                  </Group>
                ),
              },
              {
                value: "/practice",
                label: (
                  <Group gap={7} justify="center" wrap="nowrap">
                    <IconPlayerPlay size={16} />
                    <span>Practice</span>
                  </Group>
                ),
              },
            ]}
          />
        </Box>
      )}
    </Flex>
  );
}
