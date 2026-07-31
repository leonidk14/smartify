import { Box, Text } from "@mantine/core";
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
