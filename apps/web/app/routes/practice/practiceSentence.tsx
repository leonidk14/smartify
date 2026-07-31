import {
  Box,
  Button,
  Center,
  Flex,
  Group,
  Text,
  Textarea,
} from "@mantine/core";
import { useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { IconRefresh } from "@tabler/icons-react";
import { NEAR_PERFECT_THRESHOLD } from "./constants";
import type { SentenceEvaluation } from "./sentenceTypes";
import { nextWord, useSessionStore } from "../../store/session";
import { text, textCss } from "../../theme/typography";
import { PracticeProgress } from "./practiceProgress";
import { ActionBar } from "./actionBar";
import { FeedbackHeader } from "./feedbackHeader";

interface PracticeSentenceProps {
  word: string;
  meaning: string;
  original: string;
  source: string;
  simplified: string | null;
  generated: boolean;
  generationFailed: boolean;
}

type ActionData = SentenceEvaluation | { error: true };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const UnderlineWord = ({
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

const Section = ({
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

export const PracticeSentence = ({
  word,
  meaning,
  original,
  source,
  simplified,
  generated,
  generationFailed,
}: PracticeSentenceProps) => {
  const evalFetcher = useFetcher<ActionData>();
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const queue = useSessionStore((s) => s.queue);
  const meaningIds = useSessionStore((s) => s.meaningIds);
  const recordResult = useSessionStore((s) => s.recordResult);

  const isSubmitting = evalFetcher.state !== "idle";
  const data = evalFetcher.data;
  const evalError = !!data && "error" in data;
  const evaluation = data && !("error" in data) ? data : null;
  const correct = !!evaluation && evaluation.score >= NEAR_PERFECT_THRESHOLD;

  const tone = evaluation ? (correct ? "correct" : "wrong") : "neutral";
  const nextLabel = nextWord(queue, word) ? "Next word →" : "To summary →";

  const handleSubmit = () => {
    const sentence = value.trim();
    if (!sentence || isSubmitting) {
      return;
    }
    void evalFetcher.submit(
      { sentence, meaning, original },
      { method: "post" },
    );
  };

  const advance = (isCorrect: boolean) => {
    recordResult(word, "sentence", isCorrect);
    const next = nextWord(queue, word);
    if (next) {
      void navigate(
        `/practice/${encodeURIComponent(next)}/sentence?m=${encodeURIComponent(
          meaningIds[next] ?? "",
        )}`,
        { replace: true },
      );
    } else {
      void navigate("/practice/summary", { replace: true });
    }
  };

  if (generationFailed) {
    return (
      <Flex direction="column" p={16} pb={110} gap={18} flex={1}>
        <PracticeProgress />

        <Box>
          <Text {...text.label}>Rebuild the sentence</Text>
        </Box>

        <Box
          bg="var(--color-surface-error-2)"
          bd="1px solid var(--color-border-error-strong)"
          bdrs={14}
          p={16}>
          <Group
            gap={9}
            align="center"
            wrap="nowrap"
            c="var(--color-text-error-strong)">
            <Center
              {...text.bodyXs}
              {...text.emphasis}
              w={22}
              h={22}
              flex="none"
              bd="1.5px solid var(--color-text-error-strong)"
              bdrs="50%">
              !
            </Center>
            <Text {...text.uiLabel}>Couldn’t build this exercise</Text>
          </Group>
          <Text {...text.bodyXs} c="dimmed" mt={10}>
            We couldn’t generate a sentence to rephrase right now. Check your
            connection and try again.
          </Text>
          <Group gap={9} mt={14} wrap="nowrap">
            <Button
              variant="filled"
              color="black"
              h={42}
              radius={11}
              flex={1}
              leftSection={<IconRefresh size={16} />}
              onClick={() => window.location.reload()}>
              Try again
            </Button>
            <Button
              variant="outline"
              color="dark"
              h={42}
              radius={11}
              onClick={() => advance(false)}>
              Skip word
            </Button>
          </Group>
        </Box>

        <Box
          {...text.body}
          flex={1}
          p="14px 15px"
          c="dimmed"
          bd="1.5px dashed rgba(0,0,0,.12)"
          bdrs={14}>
          Your answer field is unavailable until the exercise loads.
        </Box>
      </Flex>
    );
  }

  return (
    <Flex direction="column" p={16} pb={110} gap={18} flex={1}>
      <PracticeProgress tone={tone} />

      {!evaluation ? (
        <>
          <Box>
            <Text {...text.label}>Rebuild the sentence</Text>
            <Text {...text.bodySm} c="dimmed" mt={12}>
              Rewrite this sentence.
            </Text>
          </Box>

          <Section label="Rephrased" warm>
            {simplified}
          </Section>

          <Textarea
            variant="unstyled"
            placeholder="Type your sentence…"
            autosize
            minRows={3}
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            enterKeyHint="send"
            disabled={isSubmitting}
            styles={{
              input: { padding: "14px 15px", ...textCss.body },
            }}
            bd="1.5px dashed rgba(0,0,0,.22)"
            bdrs={14}
          />

          {evalError ? (
            <Text {...text.body} c="red">
              We couldn't grade that — please try again.
            </Text>
          ) : null}

          <ActionBar>
            <Group gap={10} wrap="nowrap">
              <Button
                variant="outline"
                color="dark"
                h={48}
                radius={12}
                onClick={() => advance(false)}>
                Skip
              </Button>
              <Button
                variant="filled"
                color="black"
                h={48}
                radius={12}
                flex={1}
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={!value.trim()}>
                Check
              </Button>
            </Group>
          </ActionBar>
        </>
      ) : (
        <>
          <FeedbackHeader
            tone={correct ? "correct" : "wrong"}
            note={
              correct
                ? "That reads naturally — nicely done"
                : `You didn't quite nail “${word}”`
            }
          />

          <Box p={16} bd="1px solid var(--color-border)" bdrs={14}>
            <Text {...text.displayMd} tt="capitalize">
              {word}
            </Text>
            <Text {...text.bodySm} c="dimmed" mt={8}>
              {meaning}
            </Text>
          </Box>

          <Section label="Rephrased" warm>
            {simplified}
          </Section>

          <Section label={generated ? "Example" : "Original"}>
            <UnderlineWord sentence={original} word={word} />
            {source ? (
              <Text {...text.annotation} span display="block" mt={4}>
                — {source}
              </Text>
            ) : null}
            {generated ? (
              <Text {...text.annotation} span display="block" mt={4}>
                Generated example — not from a published source.
              </Text>
            ) : null}
          </Section>

          <Section label="Your sentence" tint={correct ? undefined : "red"}>
            {value.trim()}
          </Section>

          {evaluation.segments && evaluation.segments.length > 0 ? (
            <Section label="Corrections">
              {evaluation.segments.map((segment, i) =>
                segment.changed ? (
                  <Text key={i} {...text.emphasis} span bg="yellow.2" px={2}>
                    {segment.text}
                  </Text>
                ) : (
                  <Text key={i} span>
                    {segment.text}
                  </Text>
                ),
              )}
            </Section>
          ) : evaluation.correctedSentence ? (
            <Section label="Corrections">
              {evaluation.correctedSentence}
            </Section>
          ) : null}

          <ActionBar>
            <Button
              fullWidth
              variant="filled"
              color="black"
              h={48}
              radius={12}
              onClick={() => advance(correct)}>
              {nextLabel}
            </Button>
          </ActionBar>
        </>
      )}
    </Flex>
  );
};
