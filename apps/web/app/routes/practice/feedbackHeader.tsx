import { Center, Stack, Text } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";

type FeedbackTone = "correct" | "wrong";

const TONE = {
  correct: {
    label: "Correct!",
    color: "var(--color-text-success)",
    bg: "var(--color-surface-success)",
    icon: <IconCheck size={28} stroke={2.4} />,
  },
  wrong: {
    label: "Not quite",
    color: "var(--color-text-error)",
    bg: "var(--color-surface-error-3)",
    icon: <IconX size={26} stroke={2.4} />,
  },
} as const;

interface FeedbackHeaderProps {
  tone: FeedbackTone;
  note?: string;
}

export const FeedbackHeader = ({ tone, note }: FeedbackHeaderProps) => {
  const t = TONE[tone];

  return (
    <Stack gap={12} align="center">
      <Center
        w={56}
        h={56}
        c={t.color}
        bg={t.bg}
        bd={`1.5px solid ${t.color}`}
        bdrs="50%">
        {t.icon}
      </Center>
      <Text fw={600} fz={22} c={t.color}>
        {t.label}
      </Text>
      {note ? (
        <Text ff="monospace" fw={500} fz={11} c={t.color}>
          {note}
        </Text>
      ) : null}
    </Stack>
  );
};
