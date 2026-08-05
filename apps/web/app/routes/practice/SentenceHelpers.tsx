import { Box, Group, Text } from "@mantine/core";
import { text } from "../../theme/typography";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const UnderlineWord = ({
  sentence,
  word,
}: {
  sentence: string;
  word: string;
}) => {
  if (!word) {
    return <>{sentence}</>;
  }
  const parts = sentence.split(new RegExp(`(${escapeRegExp(word)})`, "ig"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === word.toLowerCase() ? (
          <Text
            key={i}
            span
            style={{
              textDecoration: "underline",
              textDecorationColor: "var(--color-text-success)",
            }}>
            {part}
          </Text>
        ) : (
          <Text key={i} span>
            {part}
          </Text>
        ),
      )}
    </>
  );
};

export const Section = ({
  label,
  warm = false,
  tint,
  children,
}: {
  label: string;
  warm?: boolean;
  tint?: "red";
  children: React.ReactNode;
}) => (
  <Box
    p="14px 15px"
    bg={
      warm
        ? "var(--color-surface-warm)"
        : tint === "red"
          ? "var(--color-surface-error)"
          : undefined
    }
    bdrs={14}
    bd={
      tint === "red"
        ? "1.5px solid var(--color-border-error)"
        : warm
          ? "1px solid rgba(0,0,0,.08)"
          : "1px solid var(--color-border)"
    }>
    <Text
      {...text.label}
      c={tint === "red" ? "var(--color-text-error)" : "dimmed"}
      mb={6}>
      {label}
    </Text>
    <Text {...text.proseSm}>{children}</Text>
  </Box>
);

type HintLevel = 1 | 2 | 3;

const HINT_HEADER: Record<HintLevel, string> = {
  1: "Hint · starts with",
  2: "Hint · half the letters",
  3: "Hint · the word",
};

const SEPARATORS = new Set([" ", "-"]);

const numberOfLetters = (word: string) =>
  Array.from(word).filter((ch) => !SEPARATORS.has(ch)).length;

function revealedOrdinals(letterCount: number, level: HintLevel): Set<number> {
  if (level === 3) {
    return new Set(Array.from({ length: letterCount }, (_, i) => i));
  }
  if (level === 1) {
    return new Set([0]);
  }
  const ordinals = new Set<number>();
  for (let i = 0; i < letterCount; i += 2) {
    ordinals.add(i);
  }
  return ordinals;
}

function maskWord(word: string, level: HintLevel): string {
  const shown = revealedOrdinals(numberOfLetters(word), level);
  let ordinal = -1;
  return Array.from(word)
    .map((ch) => {
      if (SEPARATORS.has(ch)) {
        return ch;
      }
      ordinal += 1;
      return shown.has(ordinal) ? ch : "_";
    })
    .join("");
}

export const HintBanner = ({
  word,
  level,
}: {
  word: string;
  level: HintLevel;
}) => {
  const masked = maskWord(word, level);
  const letterCount = numberOfLetters(word);

  return (
    <Box bg="var(--color-surface-inverse)" p="13px 15px" bdrs={13}>
      <Text {...text.label} c="var(--color-text-on-inverse-dimmed)">
        {HINT_HEADER[level]}
      </Text>
      <Group gap={10} mt={8} align="baseline">
        <Text
          span
          ff="var(--font-family-mono)"
          fz={22}
          fw={500}
          c="var(--color-text-on-inverse)"
          style={{ letterSpacing: "2px" }}>
          {masked}
        </Text>
        <Text {...text.meta} span c="var(--color-text-on-inverse-dimmed)">
          {letterCount} letters
        </Text>
      </Group>
    </Box>
  );
};

export const HighlightPhrase = ({
  simplified,
  rephrasedTarget,
}: {
  simplified: string | null;
  rephrasedTarget: string | null;
}) => {
  if (!simplified || !rephrasedTarget) {
    return (
      <Section label="Rephrased" warm>
        {simplified}
      </Section>
    );
  }

  const indexRephrasedTarget = simplified.indexOf(rephrasedTarget);
  const textBeforeTarget = simplified.slice(0, indexRephrasedTarget);
  const textAfterTarget = simplified.slice(
    indexRephrasedTarget + rephrasedTarget.length,
  );

  return (
    <Section label="Rephrased" warm>
      {textBeforeTarget}
      <Text span bg="yellow.2" px={2}>
        {rephrasedTarget}
      </Text>
      {textAfterTarget}
    </Section>
  );
};
