import { ActionIcon, Flex, Group, Progress, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router";
import { useSessionStore } from "../../store/session";
import { monoLabel } from "../wordSearch/typography";

export type ProgressTone = "neutral" | "correct" | "wrong";

const TONE_COLOR: Record<ProgressTone, string> = {
  neutral: "#1a1a1a",
  correct: "#1f8a5b",
  wrong: "#c0392b",
};

interface PracticeProgressProps {
  tone?: ProgressTone;
}

export const PracticeProgress = ({
  tone = "neutral",
}: PracticeProgressProps) => {
  const navigate = useNavigate();
  const params = useParams();
  const queue = useSessionStore((s) => s.queue);
  const reset = useSessionStore((s) => s.reset);

  const total = Math.max(1, queue.length);
  const current = Math.max(1, queue.indexOf(params.word ?? "") + 1);
  const single = total <= 1;

  const handleExit = () => {
    reset();
    navigate("/practice");
  };

  return (
    <Group gap={14} align="center" wrap="nowrap">
      <ActionIcon
        variant="subtle"
        color="gray"
        size="md"
        aria-label="Exit practice"
        onClick={handleExit}>
        <IconX size={22} />
      </ActionIcon>

      {single ? (
        <Flex flex={1} justify="center">
          <Text {...monoLabel}>Single word</Text>
        </Flex>
      ) : (
        <>
          <Progress
            flex={1}
            value={total > 0 ? (current / total) * 100 : 0}
            color={TONE_COLOR[tone]}
            size={5}
            radius="xl"
            transitionDuration={250}
          />
          <Text ff="monospace" fw={600} fz={12} c="dimmed">
            {current} / {total}
          </Text>
        </>
      )}
    </Group>
  );
};
