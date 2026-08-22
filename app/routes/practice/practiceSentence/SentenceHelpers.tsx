import { Box, Button, Center, Group, Text } from "@mantine/core";
import { text } from "../../../theme/typography";
import { IconBulb } from "@tabler/icons-react";

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
  label?: string;
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
    {label ? (
      <Text
        {...text.label}
        c={tint === "red" ? "var(--color-text-error)" : "dimmed"}
        mb={6}>
        {label}
      </Text>
    ) : null}
    <Text {...text.proseSm}>{children}</Text>
  </Box>
);

type HintLevel = 1 | 2 | 3;

const HINT_HEADER: Record<HintLevel, string> = {
  1: "Hint · starts with",
  2: "Hint · half the letters",
  3: "Hint · the word",
};

const UNMASKED_CHARS = new Set([" ", "-", "'", "’", "/"]);
const PLACEHOLDER_TOKEN = /^(sb|sth)(['’]s)?(\/(sb|sth))?$/i;
const INFINITIVE_MARKER = /^to[ -]/i;

const tokenize = (word: string) => word.split(/([ -])/);
const isMaskable = (token: string) => !PLACEHOLDER_TOKEN.test(token);

const numberOfLetters = (word: string) =>
  tokenize(word)
    .filter(isMaskable)
    .flatMap((token) => Array.from(token))
    .filter((ch) => !UNMASKED_CHARS.has(ch)).length;

const firstLetterIndex = (word: string) => {
  const marker = INFINITIVE_MARKER.exec(word);
  if (marker === null) {
    return 0;
  }
  const lettersToSkip = numberOfLetters(marker[0]);
  return lettersToSkip;
};

function revealedLetterIndexes(word: string, level: HintLevel): Set<number> {
  const letterCount = numberOfLetters(word);
  if (level === 3) {
    return new Set(Array.from({ length: letterCount }, (_, i) => i));
  }
  if (level === 1) {
    return new Set([firstLetterIndex(word)]);
  }
  const letterIndexes = new Set<number>();
  for (let i = 0; i < letterCount; i += 2) {
    letterIndexes.add(i);
  }
  return letterIndexes;
}

function maskWord(word: string, level: HintLevel): string {
  const revealedIndexes = revealedLetterIndexes(word, level);
  let letterIndex = -1;
  return tokenize(word)
    .map((token) => {
      if (!isMaskable(token)) {
        return token;
      }
      return Array.from(token)
        .map((ch) => {
          if (UNMASKED_CHARS.has(ch)) {
            return ch;
          }
          letterIndex += 1;
          return revealedIndexes.has(letterIndex) ? ch : "_";
        })
        .join("");
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
    return <Section warm>{simplified}</Section>;
  }

  const indexRephrasedTarget = simplified.indexOf(rephrasedTarget);
  const textBeforeTarget = simplified.slice(0, indexRephrasedTarget);
  const textAfterTarget = simplified.slice(
    indexRephrasedTarget + rephrasedTarget.length,
  );

  return (
    <Section warm>
      {textBeforeTarget}
      <Text span bg="yellow.2" px={2}>
        {rephrasedTarget}
      </Text>
      {textAfterTarget}
    </Section>
  );
};

export const SentenceHintsCTAs = ({
  hintLevel,
  onCTAHintClick,
  onConfirmReveal,
}: {
  hintLevel: number;
  onCTAHintClick: (nextLevel: -1 | 0 | 2 | 1 | 3) => void;
  onConfirmReveal: () => void;
}) => {
  return (
    <>
      {hintLevel === -1 && (
        <Group gap={8} align="center" wrap="nowrap">
          <Center
            {...text.bodyXs}
            w={16}
            h={16}
            flex="none"
            c="dimmed"
            bd="1.5px solid var(--color-border)"
            bdrs="50%">
            ?
          </Center>
          <Text {...text.meta}>A hint will appear if you get stuck</Text>
        </Group>
      )}
      {hintLevel === 0 && (
        <Group justify="flex-start">
          <Button
            variant="subtle"
            color="dark"
            size="compact-md"
            leftSection={<IconBulb size={16} />}
            onClick={() => onCTAHintClick(1)}>
            Reveal a hint
          </Button>
        </Group>
      )}
      {hintLevel === 1 && (
        <Group justify="flex-start">
          <Button
            variant="subtle"
            color="dark"
            size="compact-md"
            leftSection={<IconBulb size={16} />}
            onClick={() => onCTAHintClick(2)}>
            Reveal more letters
          </Button>
        </Group>
      )}
      {hintLevel === 2 && (
        <Group justify="flex-start">
          <Button
            variant="subtle"
            color="dark"
            size="compact-md"
            leftSection={<IconBulb size={16} />}
            onClick={onConfirmReveal}>
            Reveal the whole word
          </Button>
        </Group>
      )}
      {hintLevel === 3 && (
        <Text {...text.meta} c="var(--color-warning)">
          You revealed the word — this one won't be scored.
        </Text>
      )}
    </>
  );
};
