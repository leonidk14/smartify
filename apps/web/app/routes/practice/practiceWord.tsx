import { Box, Button, Flex, Group, Text, TextInput } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useNavigation } from "react-router";
import { normalize } from "../wordSearch/normalize";
import { nextWord, useSessionStore } from "../../store/session";
import { useKeyboardInset } from "../../lib/useKeyboardInset";
import { text } from "../../theme/typography";
import { PracticeProgress } from "./practiceProgress";
import { ActionBar } from "./actionBar";
import { FeedbackHeader } from "./feedbackHeader";

interface PracticeWordProps {
  word: string;
  definition: string;
  meaningId: string;
  partOfSpeech: string;
  hints: string[];
  display?: string;
}

type View = "input" | "correct" | "wrong";

const PartOfSpeechPill = ({ children }: { children: React.ReactNode }) => (
  <Text
    {...text.annotation}
    span
    display="inline-block"
    px={11}
    py={4}
    bd="1px solid rgba(0,0,0,.18)"
    bdrs={999}>
    {children}
  </Text>
);

export const PracticeWord = ({
  word,
  definition,
  meaningId,
  partOfSpeech,
  hints,
  display,
}: PracticeWordProps) => {
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [view, setView] = useState<View>("input");
  const navigation = useNavigation();
  const navigate = useNavigate();
  const definitionRef = useRef<HTMLParagraphElement>(null);
  const isKeyboardOpen = useKeyboardInset() > 0;

  const queue = useSessionStore((s) => s.queue);
  const mode = useSessionStore((s) => s.mode);
  const meaningIds = useSessionStore((s) => s.meaningIds);
  const startSession = useSessionStore((s) => s.startSession);
  const setMeaning = useSessionStore((s) => s.setMeaning);
  const setPhase = useSessionStore((s) => s.setPhase);
  const recordResult = useSessionStore((s) => s.recordResult);

  useEffect(() => {
    if (!queue.includes(word)) {
      startSession([word]);
    }
  }, [queue, startSession, word]);

  // Keyed off the keyboard opening rather than the field focusing: at focus time
  // the viewport hasn't shrunk yet, so the scroll would land short.
  useEffect(() => {
    if (!isKeyboardOpen) {
      return;
    }
    definitionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [isKeyboardOpen, view, word]);

  const tone =
    view === "correct" ? "correct" : view === "wrong" ? "wrong" : "neutral";

  const canShowHint = hints.length > 1;

  const handleCheck = () => {
    if (!answer.trim()) {
      return;
    }
    if (normalize(answer) === normalize(word)) {
      setView("correct");
    } else {
      setAttempts((a) => a + 1);
      setShowHint(false);
      setView("wrong");
    }
  };

  const tryAgain = () => {
    setAnswer("");
    setView("input");
  };

  const handleNext = () => {
    setMeaning(word, meaningId);
    recordResult(word, "word", view === "correct");

    const next = nextWord(queue, word);
    if (next) {
      void navigate(`/practice/${encodeURIComponent(next)}`, { replace: true });
      return;
    }

    if (mode === "word") {
      void navigate("/practice/summary", { replace: true });
      return;
    }

    setPhase("sentence");
    const firstWord = queue[0] ?? word;
    const firstMeaningId =
      firstWord === word ? meaningId : meaningIds[firstWord];
    void navigate(
      `/practice/${encodeURIComponent(firstWord)}/sentence?m=${encodeURIComponent(
        firstMeaningId ?? "",
      )}`,
      { replace: true },
    );
  };

  const revealWord = view === "wrong" && attempts >= 2;
  const loading = navigation.state === "loading";
  const nextLabel = nextWord(queue, word)
    ? "Next word →"
    : mode === "word"
      ? "To summary →"
      : "To sentences →";

  return (
    <Flex direction="column" p={16} pb={110} gap={20} flex={1}>
      <PracticeProgress tone={tone} />

      {view === "input" && (
        <>
          <Box>
            <Text {...text.label}>Guess the word</Text>
            <Box mt={14}>
              <PartOfSpeechPill>{partOfSpeech}</PartOfSpeechPill>
            </Box>
            <Text
              {...text.prose}
              ref={definitionRef}
              mt={16}
              style={{ scrollMarginTop: 16 }}>
              {definition}
            </Text>
          </Box>

          <Box>
            <TextInput
              variant="unstyled"
              placeholder="type the word…"
              size="xl"
              value={answer}
              onChange={(e) => setAnswer(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCheck();
                }
              }}
              autoFocus
              style={{ borderBottom: "2px solid var(--color-text)" }}
              autoComplete="off"
              type="search"
              enterKeyHint="send"
            />
          </Box>

          {showHint && hints.length > 1 && (
            <Box
              bg="var(--color-surface-warm)"
              p="12px 14px"
              bd="1px solid rgba(0,0,0,.08)"
              bdrs={12}>
              <Text {...text.label} mb={8}>
                One of these words
              </Text>
              <Group gap={10}>
                {hints.map((h, i) => (
                  <Group key={h} gap={10} align="center">
                    {i > 0 && (
                      <Text {...text.bodySm} c="dimmed">
                        ·
                      </Text>
                    )}
                    <Text {...text.proseSm} tt="capitalize">
                      {h}
                    </Text>
                  </Group>
                ))}
              </Group>
            </Box>
          )}

          <ActionBar>
            <Group gap={10} wrap="nowrap">
              {canShowHint && (
                <Button
                  variant="outline"
                  color="dark"
                  h={48}
                  radius={12}
                  onClick={() => setShowHint(true)}
                  disabled={showHint}>
                  Hint
                </Button>
              )}
              <Button
                variant="filled"
                color="black"
                h={48}
                radius={12}
                flex={1}
                onClick={handleCheck}
                disabled={!answer.trim()}>
                Check
              </Button>
            </Group>
          </ActionBar>
        </>
      )}

      {view === "correct" && (
        <>
          <FeedbackHeader tone="correct" />
          <Box p={16} bd="1px solid var(--color-border)" bdrs={14}>
            <Text {...text.displayLg} tt="capitalize">
              {display}
            </Text>
            <Text {...text.bodySm} c="dimmed" mt={10}>
              {definition}
            </Text>
          </Box>

          <ActionBar>
            <Button
              fullWidth
              variant="filled"
              color="black"
              h={48}
              radius={12}
              onClick={handleNext}
              loading={loading}>
              {nextLabel}
            </Button>
          </ActionBar>
        </>
      )}

      {view === "wrong" && (
        <>
          <FeedbackHeader tone="wrong" />

          <Box
            p="14px 15px"
            bg="var(--color-surface-error)"
            bd="1.5px solid var(--color-border-error)"
            bdrs={14}>
            <Text {...text.label} c="var(--color-text-error)" mb={6}>
              Your answer
            </Text>
            <Text {...text.proseSm} tt="capitalize">
              {answer.trim()}
            </Text>
          </Box>

          {revealWord && (
            <Box p={16} bdrs={14} bd="1px solid var(--color-border)">
              <Text {...text.label} mb={6}>
                Answer
              </Text>
              <Text {...text.displayMd} tt="capitalize">
                {display ?? word}
              </Text>
              <Text {...text.bodySm} c="dimmed" mt={8}>
                {definition}
              </Text>
            </Box>
          )}

          <ActionBar>
            <Group gap={10} wrap="nowrap">
              {!revealWord && (
                <Button
                  variant="outline"
                  color="dark"
                  h={48}
                  radius={12}
                  onClick={tryAgain}>
                  Try again
                </Button>
              )}
              <Button
                variant="filled"
                color="black"
                h={48}
                radius={12}
                flex={1}
                onClick={handleNext}
                loading={loading}>
                {nextLabel}
              </Button>
            </Group>
          </ActionBar>
        </>
      )}
    </Flex>
  );
};
