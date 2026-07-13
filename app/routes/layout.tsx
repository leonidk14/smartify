import {
  Outlet,
  useLocation,
  useNavigate,
  useNavigation,
  Link,
} from "react-router";
import {
  Box,
  Button,
  Flex,
  Group,
  Loader,
  SegmentedControl,
  Text,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBook,
  IconBrain,
  IconPencil,
} from "@tabler/icons-react";
import { useSessionStore } from "../store/session";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const phase = useSessionStore((s) => s.phase);
  const queue = useSessionStore((s) => s.queue);
  const meaningIds = useSessionStore((s) => s.meaningIds);
  const setPhase = useSessionStore((s) => s.setPhase);

  const isHome = location.pathname === "/";
  const isPracticeLanding = location.pathname === "/practice";
  const isTopLevelScreen = isHome || isPracticeLanding;

  const isPracticeWord = /^\/practice\/.+/.test(location.pathname);
  const isWordScreen =
    /^\/practice\/[^/]+$/.test(location.pathname) &&
    location.pathname !== "/practice/summary";
  const showSkip = isWordScreen && phase === "word";

  const sentenceMatch = location.pathname.match(
    /^\/practice\/([^/]+)\/sentence$/,
  );
  const backTo = sentenceMatch ? `/practice/${sentenceMatch[1]}` : "/practice";

  const isLoadingSentence =
    navigation.state === "loading" &&
    !!navigation.location &&
    /^\/practice\/[^/]+\/sentence$/.test(navigation.location.pathname);

  const skipToSentences = () => {
    setPhase("sentence");
    const first = queue[0];
    navigate(
      `/practice/${encodeURIComponent(first)}/sentence?m=${encodeURIComponent(
        meaningIds[first] ?? "",
      )}`,
    );
  };

  return (
    <Flex direction="column" style={{ minHeight: "100vh" }}>
      {!isTopLevelScreen && (
        <Box style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}>
          <Group
            justify={isPracticeWord ? "space-between" : "flex-end"}
            px={16}
            h={48}>
            {isPracticeWord && (
              <Button
                component={Link}
                to={backTo}
                variant="subtle"
                color="dark"
                leftSection={<IconArrowLeft size={18} />}>
                Back
              </Button>
            )}
            {showSkip && (
              <Button
                variant="subtle"
                color="dark"
                onClick={skipToSentences}
                leftSection={<IconPencil size={18} />}>
                To sentences
              </Button>
            )}
          </Group>
        </Box>
      )}

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
                    <IconBrain size={16} />
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
