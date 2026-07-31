import { useEffect } from "react";
import { Link, NavigationType, useBlocker, useNavigate } from "react-router";
import { Box, Button, Flex, Group, Text } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useSessionStore } from "../store/session";
import { text } from "../theme/typography";
import { ActionBar } from "./practice/actionBar";

const StepTag: Record<string, string> = {
  word: "Guess a word",
  sentence: "Rebuild a sentence",
};

export default function PracticeSummary() {
  const navigate = useNavigate();
  const results = useSessionStore((s) => s.results);
  const reset = useSessionStore((s) => s.reset);

  const blocker = useBlocker(
    ({ historyAction }) => historyAction === NavigationType.Pop,
  );

  useEffect(() => {
    if (blocker.state !== "blocked") {
      return;
    }
    reset();
    void navigate("/practice", { replace: true });
  }, [blocker, navigate, reset]);

  const correctCount = results.filter((r) => r.correct).length;
  const reviewCount = results.length - correctCount;

  const done = () => {
    reset();
    void navigate("/practice", { replace: true });
  };

  if (results.length === 0) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        flex={1}
        p={16}
        gap={16}>
        <Text {...text.body} c="dimmed">
          No practice session to summarize.
        </Text>
        <Button
          component={Link}
          to="/practice"
          variant="outline"
          size="lg"
          color="dark">
          Back to practice
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" p={20} pb={110} gap={18} flex={1}>
      <Box>
        <Text {...text.displayLg}>Session complete</Text>
        <Text {...text.meta} mt={8}>
          {correctCount} of {results.length} correct · nice work
        </Text>
      </Box>

      <Group gap={10} grow>
        <StatTile
          value={correctCount}
          label="Correct"
          color="var(--color-text-success)"
        />
        <StatTile
          value={reviewCount}
          label="Review"
          color="var(--color-text-error)"
        />
      </Group>

      <Flex direction="column">
        {results.map((r, i) => (
          <Group
            key={`${r.word}-${r.step}-${i}`}
            gap={12}
            align="center"
            py={12}
            wrap="nowrap"
            style={{ borderBottom: "1px solid rgba(0,0,0,.07)" }}>
            {r.correct ? (
              <IconCheck
                size={18}
                stroke={2.4}
                style={{ color: "var(--color-text-success)" }}
              />
            ) : (
              <IconX
                size={18}
                stroke={2.4}
                style={{ color: "var(--color-text-error)" }}
              />
            )}
            <Text {...text.displaySm} flex={1} tt="capitalize">
              {r.word}
            </Text>
            <Text
              {...text.label}
              c={r.correct ? "dimmed" : "var(--color-text-error)"}>
              {StepTag[r.step]}
            </Text>
          </Group>
        ))}
      </Flex>

      <ActionBar>
        <Button
          fullWidth
          variant="filled"
          color="black"
          h={48}
          radius={12}
          onClick={done}>
          Done
        </Button>
      </ActionBar>
    </Flex>
  );
}

const StatTile = ({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) => (
  <Box p={12} ta="center" bd="1px solid var(--color-border)" bdrs={12}>
    <Text {...text.displayLg} c={color}>
      {value}
    </Text>
    <Text {...text.label} mt={2}>
      {label}
    </Text>
  </Box>
);
