import { Group, Box } from "@mantine/core";

interface LevelBarsProps {
  levels: number[];
}

const TRACK_HEIGHT = 56;
const MIN_BAR_HEIGHT = 8;

export function LevelBars({ levels }: LevelBarsProps) {
  return (
    <Group gap={4} align="center" h={TRACK_HEIGHT} wrap="nowrap">
      {levels.map((level, index) => (
        <Box
          key={index}
          w={3}
          h={Math.max(MIN_BAR_HEIGHT, level * TRACK_HEIGHT)}
          bg={level > 0.6 ? "var(--color-text)" : "rgba(0,0,0,.35)"}
          bdrs={2}
        />
      ))}
    </Group>
  );
}
