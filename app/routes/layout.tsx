import { useEffect } from "react";
import {
  Outlet,
  useLocation,
  useMatches,
  useNavigate,
  useRevalidator,
  Link,
} from "react-router";
import {
  ActionIcon,
  Box,
  Flex,
  Group,
  SegmentedControl,
  Text,
} from "@mantine/core";
import type { ShouldRevalidateFunctionArgs } from "react-router";
import {
  IconBook,
  IconChevronLeft,
  IconDots,
  IconMicrophone,
  IconPlayerPlay,
  IconX,
} from "@tabler/icons-react";
import { text } from "../theme/typography";
import { supabase } from "../lib/supabaseClient";
import { readVocabulary } from "./wordSearch/vocabulary";
import { IS_SPEECH_ENABLED } from "../featureFlags";
import { MAX_DURATION_SECONDS } from "./speech/speechConstants";
import { formatDuration, formatRecordingDate } from "./speech/speechFormat";
import { isSpeechRecording } from "./speech/speechTypes";

const TOP_LEVEL_PATHS: string[] = (IS_SPEECH_ENABLED as boolean)
  ? ["/", "/speech", "/practice"]
  : ["/", "/practice"];

const MODE_LABELS: Record<string, string> = {
  word: "Guess the word",
  sentence: "Rebuild the sentence",
  both: "Guess & rebuild",
};

function isEmptyLookupResult(actionResult: unknown): boolean {
  if (typeof actionResult !== "object" || actionResult === null) {
    return false;
  }
  const { dictionary } = actionResult as { dictionary?: { groups?: unknown } };
  return Array.isArray(dictionary?.groups) && dictionary.groups.length === 0;
}

type PushNavigateMessage = { type: "PUSH_NAVIGATE"; url: string };

function isPushNavigateMessage(data: unknown): data is PushNavigateMessage {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const { type, url } = data as { type?: unknown; url?: unknown };
  return type === "PUSH_NAVIGATE" && typeof url === "string";
}

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
  if (formMethod === undefined || formMethod === "GET") {
    return false;
  }

  if (isEmptyLookupResult(actionResult)) {
    return false;
  }

  return true;
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const matches = useMatches();

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
      const data: unknown = event.data;
      if (isPushNavigateMessage(data)) {
        void navigate(data.url);
      }
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);

  const isTopLevelScreen = TOP_LEVEL_PATHS.includes(location.pathname);

  const isSelectScreen = location.pathname === "/practice/select";
  const selectMode = new URLSearchParams(location.search).get("mode") ?? "both";

  const isSpeechRecordScreen = location.pathname === "/speech/record";

  // /speech/:id's header needs the recording's date and duration, which live
  // in that route's own loaderData — read via useMatches() rather than
  // duplicating the fetch here, since layout.tsx otherwise only loads the
  // vocabulary.
  const speechRecordingMatch = matches.find(
    (match) => match.id === "routes/speechRecording",
  );
  const speechRecording = isSpeechRecording(speechRecordingMatch?.loaderData)
    ? speechRecordingMatch.loaderData
    : null;

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

      {isSpeechRecordScreen ? (
        <Box p="16px 16px 0">
          <Group justify="space-between" align="center" wrap="nowrap">
            <IconX
              size={22}
              onClick={() => void navigate("/speech")}
              style={{ color: "rgba(0,0,0,.45)", cursor: "pointer" }}
            />
            <Text {...text.meta} style={{ letterSpacing: ".6px" }}>
              MAX {formatDuration(MAX_DURATION_SECONDS)}
            </Text>
          </Group>
        </Box>
      ) : null}

      {speechRecording ? (
        <Box p="16px 16px 0">
          <Group justify="space-between" align="center" wrap="nowrap">
            <ActionIcon
              component={Link}
              to="/speech"
              variant="subtle"
              color="gray"
              size="md"
              aria-label="Back to Speech">
              <IconChevronLeft size={20} />
            </ActionIcon>
            <Text {...text.meta}>
              {formatRecordingDate(speechRecording.createdAt)} ·{" "}
              {formatDuration(speechRecording.durationSeconds)}
            </Text>
            <IconDots size={16} style={{ color: "rgba(0,0,0,.45)" }} />
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
            value={location.pathname}
            onChange={(value) => void navigate(value)}
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
              ...((IS_SPEECH_ENABLED as boolean)
                ? [
                    {
                      value: "/speech",
                      label: (
                        <Group gap={7} justify="center" wrap="nowrap">
                          <IconMicrophone size={16} />
                          <span>Speech</span>
                        </Group>
                      ),
                    },
                  ]
                : []),
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
