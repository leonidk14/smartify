import { ActionIcon, Flex, Group, Progress, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useNavigate, useParams } from "react-router";
import { useSessionStore } from "../../store/session";
import { text } from "../../theme/typography";

export type ProgressTone = "neutral" | "correct" | "wrong";

const TONE_COLOR: Record<ProgressTone, string> = {
  neutral: "var(--color-text)",
  correct: "var(--color-text-success)",
  wrong: "var(--color-text-error)",
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
    navigate("/practice", { replace: true });
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
          <Text {...text.label}>Single word</Text>
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
          <Text {...text.meta}>
            {current} / {total}
          </Text>
        </>
      )}
    </Group>
  );
};
