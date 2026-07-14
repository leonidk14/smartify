import { Link, useNavigate } from "react-router";
import { Box, Button, Flex, Group, Text } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useSessionStore } from "../store/session";
import { ActionBar } from "./practice/actionBar";
import { CARD_BORDER } from "./practice/constants";

const GREEN = "#1f8a5b";
const RED = "#c0392b";

const StepTag: Record<string, string> = {
  word: "Guess a word",
  sentence: "Rebuild a sentence",
};

export default function PracticeSummary() {
  const navigate = useNavigate();
  const results = useSessionStore((s) => s.results);
  const reset = useSessionStore((s) => s.reset);

  const correctCount = results.filter((r) => r.correct).length;
  const reviewCount = results.length - correctCount;

  const done = () => {
    reset();
    navigate("/practice");
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
        <Text size="lg" c="dimmed">
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
        <Text className="serif" fz={26} lh={1.1}>
          Session complete
        </Text>
        <Text ff="monospace" fw={500} fz={12} c="dimmed" mt={8}>
          {correctCount} of {results.length} correct · nice work
        </Text>
      </Box>

      <Group gap={10} grow>
        <StatTile value={correctCount} label="CORRECT" color={GREEN} />
        <StatTile value={reviewCount} label="REVIEW" color={RED} />
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
              <IconCheck size={18} color={GREEN} stroke={2.4} />
            ) : (
              <IconX size={18} color={RED} stroke={2.4} />
            )}
            <Text className="serif" fz={17} flex={1} tt="capitalize">
              {r.word}
            </Text>
            <Text
              ff="monospace"
              fw={500}
              fz={11}
              c={r.correct ? "dimmed" : RED}>
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
  <Box p={12} ta="center" bd={CARD_BORDER} bdrs={12}>
    <Text className="serif" fz={24} c={color}>
      {value}
    </Text>
    <Text ff="monospace" fw={500} fz={10} c="dimmed" mt={2}>
      {label}
    </Text>
  </Box>
);
