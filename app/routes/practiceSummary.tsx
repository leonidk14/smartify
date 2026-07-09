import { Link } from "react-router";
import { Badge, Box, Button, Flex, Group, Paper, Text } from "@mantine/core";
import { NEAR_PERFECT_THRESHOLD } from "./practice/constants";
import { useSessionStore } from "../store/session";

export default function PracticeSummary() {
  const queue = useSessionStore((s) => s.queue);
  const scores = useSessionStore((s) => s.scores);

  const rows = queue.map((word) => ({ word, score: scores[word] }));
  const graded = rows.filter(
    (r): r is { word: string; score: number } => typeof r.score === "number",
  );
  const average =
    graded.length > 0
      ? graded.reduce((sum, r) => sum + r.score, 0) / graded.length
      : null;

  if (queue.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" flex={1} p={16} gap={16}>
        <Text size="lg" c="dimmed">
          No practice session to summarize.
        </Text>
        <Button component={Link} to="/practice" variant="outline" size="lg" color="dark">
          Back to practice
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" p={16} gap={16} flex={1}>
      <Flex align="center" gap={8}>
        <Text size="xl" fw={700}>
          Session complete
        </Text>
        {average !== null && (
          <Badge
            size="xl"
            variant="filled"
            color={average >= NEAR_PERFECT_THRESHOLD ? "green" : "dark"}>
            {average.toFixed(1)} / 10 avg
          </Badge>
        )}
      </Flex>

      <Flex direction="column" gap={8}>
        {rows.map(({ word, score }) => (
          <Paper key={word} p="md" withBorder>
            <Group justify="space-between">
              <Text size="lg" fw={500} tt="capitalize">
                {word}
              </Text>
              {typeof score === "number" ? (
                <Badge
                  size="lg"
                  variant="filled"
                  color={score >= NEAR_PERFECT_THRESHOLD ? "green" : "dark"}>
                  {score.toFixed(1)} / 10
                </Badge>
              ) : (
                <Badge size="lg" variant="light" color="gray">
                  Skipped
                </Badge>
              )}
            </Group>
          </Paper>
        ))}
      </Flex>

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
        <Button component={Link} to="/practice" variant="filled" size="lg" color="black">
          Back to practice
        </Button>
      </Box>
    </Flex>
  );
}
