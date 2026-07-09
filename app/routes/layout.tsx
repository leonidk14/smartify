import {
  Outlet,
  useLocation,
  useNavigate,
  useNavigation,
  Link,
} from "react-router";
import { Box, Button, Flex, Group, Loader, Text } from "@mantine/core";
import {
  IconArrowLeft,
  IconBrain,
  IconPencil,
  IconSearch,
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

  const isSearch = location.pathname === "/";
  const isPracticeWord = /^\/practice\/.+/.test(location.pathname);

  const isWordScreen =
    /^\/practice\/[^/]+$/.test(location.pathname) &&
    location.pathname !== "/practice/summary";
  const showSkip = isWordScreen && phase === "word";

  const sentenceMatch = location.pathname.match(
    /^\/practice\/([^/]+)\/sentence$/,
  );
  const backTo = sentenceMatch
    ? `/practice/${sentenceMatch[1]}`
    : "/practice";

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
              to={backTo}
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
          ) : showSkip ? (
            <Button
              variant="subtle"
              color="dark"
              onClick={skipToSentences}
              leftSection={<IconPencil size={18} />}>
              To sentences
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
      <Flex direction="column" flex={1} style={{ position: "relative" }}>
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
    </Flex>
  );
}
