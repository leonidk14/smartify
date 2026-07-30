import { useEffect } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useRevalidator,
  Link,
} from "react-router";
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Group,
  SegmentedControl,
  Text,
} from "@mantine/core";
import type { ShouldRevalidateFunctionArgs } from "react-router";
import { IconBook, IconChevronLeft, IconPlayerPlay } from "@tabler/icons-react";
import { text } from "../theme/typography";
import { supabase } from "../lib/supabaseClient";
import { readVocabulary } from "./wordSearch/vocabulary";

const MODE_LABELS: Record<string, string> = {
  word: "Guess the word",
  sentence: "Rebuild the sentence",
  both: "Guess & rebuild",
};

export async function clientLoader() {
  return readVocabulary();
}

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  formMethod,
  actionResult,
}: ShouldRevalidateFunctionArgs) {
  // An explicit revalidator.revalidate() — the auth-change refetch below — arrives
  // with no formMethod and an unchanged URL. The guard that follows would otherwise
  // swallow it. Submissions still fall through, so their own checks still apply.
  if (formMethod === undefined && currentUrl.href === nextUrl.href) {
    return true;
  }

  // The layout loads the whole vocabulary once and only needs to refetch after a
  // mutation. Without this, React Router's default revalidation refetches it on
  // every search-param change (e.g. the ?mode added when opening /practice/select).
  if (formMethod == null || formMethod === "GET") {
    return false;
  }

  if (actionResult?.dictionary?.groups?.length === 0) {
    return false;
  }

  return true;
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        void revalidator.revalidate();
      }
    });

    return () => subscription.unsubscribe();
  }, [revalidator]);

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
              <Text {...text.label}>{MODE_LABELS[selectMode]}</Text>
              <Text {...text.displayMd} mt={2}>
                Which words?
              </Text>
            </Box>
          </Group>
        </Box>
      ) : null}

      <Flex direction="column" flex={1} pb={isTopLevelScreen ? 80 : undefined}>
        <Outlet />
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
              "linear-gradient(to bottom, rgba(255,255,255,0), var(--color-surface) 12px)",
          }}>
          <SegmentedControl
            fullWidth
            radius={12}
            color="ink"
            value={isHome ? "/" : "/practice"}
            onChange={(value) => navigate(value)}
            styles={{ root: { background: "var(--color-surface-warm)" } }}
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
