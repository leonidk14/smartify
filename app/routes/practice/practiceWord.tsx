import { Box, Button, Flex, Text, TextInput, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useNavigate, useNavigation } from "react-router";
import { normalize } from "../wordSearch/normalize";
import { nextWord, useSessionStore } from "../../store/session";

interface PracticeWordProps {
  word: string;
  definition: string;
  meaningId: string;
  hints: string[];
}

const notify = (color: string, message: string) =>
  notifications.show({
    color,
    message,
    autoClose: 2500,
    styles: { description: { fontSize: "var(--mantine-font-size-lg)" } },
  });

export const PracticeWord = ({
  word,
  definition,
  meaningId,
  hints,
}: PracticeWordProps) => {
  const [answer, setAnswer] = useState("");
  const [triedOnce, setTriedOnce] = useState(false);
  const [showHintButton, setShowHintButton] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [solved, setSolved] = useState(false);
  const navigation = useNavigation();
  const navigate = useNavigate();

  const queue = useSessionStore((s) => s.queue);
  const meaningIds = useSessionStore((s) => s.meaningIds);
  const startSession = useSessionStore((s) => s.startSession);
  const setMeaning = useSessionStore((s) => s.setMeaning);
  const setPhase = useSessionStore((s) => s.setPhase);

  useEffect(() => {
    const timer = setTimeout(() => setShowHintButton(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Direct-URL / refresh entry: make this a coherent single-word session.
  useEffect(() => {
    if (!queue.includes(word)) {
      startSession([word]);
    }
  }, [word]);

  const handleNext = () => {
    setMeaning(word, meaningId);
    const next = nextWord(queue, word);
    if (next) {
      navigate(`/practice/${encodeURIComponent(next)}`);
      return;
    }

    setPhase("sentence");
    const first = queue[0] ?? word;
    const firstMeaningId = first === word ? meaningId : meaningIds[first];
    navigate(
      `/practice/${encodeURIComponent(first)}/sentence?m=${encodeURIComponent(
        firstMeaningId,
      )}`,
    );
  };

  const handleSubmit = () => {
    if (!answer.trim()) return;

    const isCorrectAnswer = normalize(answer) === normalize(word);

    if (isCorrectAnswer) {
      setSolved(true);
      notify("green", "Correct! On to the next step");
      return;
    }

    if (!triedOnce) {
      setTriedOnce(true);
      setAnswer("");
      notify("red", "Not quite, try again");
      return;
    }

    notify("red", `Not quite. The word was "${word}"`);
  };

  const handleHint = () => {
    setTooltipOpen(true);
    setTimeout(() => setTooltipOpen(false), 3000);
  };

  return (
    <Flex direction="column" p={16} gap={16} flex={1}>
      <Text size="xl" fw={700}>
        {definition}
      </Text>

      <TextInput
        variant="unstyled"
        placeholder="Type your answer..."
        size="xl"
        value={answer}
        onChange={(e) => setAnswer(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        autoFocus
        style={{ borderBottom: "1px solid #dee2e6" }}
      />

      <Box
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background:
            "linear-gradient(to bottom, rgba(255, 255, 255, 0), #fff 16px)",
          paddingTop: 32,
          paddingBottom: 16,
          display: "flex",
          justifyContent: "center",
          gap: 16,
        }}>
        <Tooltip
          label={
            <Flex direction="column" align="center" gap={4}>
              <Text size="xs">One of these words:</Text>
              <Flex gap={8}>
                {hints.map((h, i) => (
                  <Flex key={h} gap={8} align="center">
                    {i > 0 && (
                      <Text size="sm" c="dimmed">
                        /
                      </Text>
                    )}
                    <Text size="sm" tt="capitalize">
                      {h}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Flex>
          }
          opened={tooltipOpen}
          position="top"
          withArrow>
          <Button
            variant="outline"
            size="lg"
            color="dark"
            type="button"
            onClick={handleHint}
            style={{
              opacity: showHintButton && !solved ? 1 : 0,
              pointerEvents: showHintButton && !solved ? "auto" : "none",
              transition: "opacity 400ms ease",
            }}>
            Give a hint
          </Button>
        </Tooltip>
        {solved ? (
          <Button
            variant="filled"
            size="lg"
            color="black"
            type="button"
            onClick={handleNext}
            loading={navigation.state === "loading"}>
            Next step
          </Button>
        ) : (
          <Button
            variant="filled"
            size="lg"
            color="black"
            type="button"
            onClick={handleSubmit}
            disabled={!answer.trim()}>
            Submit answer
          </Button>
        )}
      </Box>
    </Flex>
  );
};
