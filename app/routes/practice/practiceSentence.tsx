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
import { CARD_BORDER, NEAR_PERFECT_THRESHOLD } from "./constants";
import type { SentenceEvaluation } from "./sentenceTypes";
import { nextWord, useSessionStore } from "../../store/session";
import { monoLabel } from "../wordSearch/typography";
import { PracticeProgress } from "./practiceProgress";
import { ActionBar } from "./actionBar";
import { FeedbackHeader } from "./feedbackHeader";

interface PracticeSentenceProps {
  word: string;
  meaning: string;
  original: string;
  source: string;
  simplified: string;
  generated: boolean;
  generationFailed: boolean;
}

type ActionData = SentenceEvaluation | { error: true };

const ERROR_ACCENT = "#b4441e";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const UnderlineWord = ({ text, word }: { text: string; word: string }) => {
  if (!word) {
    return <>{text}</>;
  }
  const parts = text.split(new RegExp(`(${escapeRegExp(word)})`, "ig"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === word.toLowerCase() ? (
          <Text
            key={i}
            span
            style={{
              textDecoration: "underline",
              textDecorationColor: "#1f8a5b",
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
    bg={warm ? "var(--surface-warm)" : tint === "red" ? "#fdf3f1" : undefined}
    bdrs={14}
    bd={
      tint === "red"
        ? "1.5px solid #f0c9c3"
        : warm
          ? "1px solid rgba(0,0,0,.08)"
          : CARD_BORDER
    }>
    <Text
      ff="monospace"
      fw={500}
      fz={10}
      c={tint === "red" ? "#c0392b" : "dimmed"}
      mb={6}>
      {label}
    </Text>
    <Text className="serif" fz={15} lh={1.5}>
      {children}
    </Text>
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
    evalFetcher.submit({ sentence, meaning, original }, { method: "post" });
  };

  const advance = (isCorrect: boolean) => {
    recordResult(word, "sentence", isCorrect);
    const next = nextWord(queue, word);
    if (next) {
      navigate(
        `/practice/${encodeURIComponent(next)}/sentence?m=${encodeURIComponent(
          meaningIds[next] ?? "",
        )}`,
      );
    } else {
      navigate("/practice/summary");
    }
  };

  if (generationFailed) {
    return (
      <Flex direction="column" p={16} pb={110} gap={18} flex={1}>
        <PracticeProgress />

        <Box>
          <Text {...monoLabel}>Rebuild the sentence</Text>
        </Box>

        <Box bg="#fbf1ee" bd={`1px solid ${ERROR_ACCENT}47`} bdrs={14} p={16}>
          <Group gap={9} align="center" wrap="nowrap" c={ERROR_ACCENT}>
            <Center
              w={22}
              h={22}
              fz={13}
              fw={700}
              flex="none"
              bd={`1.5px solid ${ERROR_ACCENT}`}
              bdrs="50%">
              !
            </Center>
            <Text fw={600} fz={13}>
              Couldn’t build this exercise
            </Text>
          </Group>
          <Text fz={13} lh={1.5} c="dimmed" mt={10}>
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
          flex={1}
          p="14px 15px"
          c="dimmed"
          fz={15}
          lh={1.5}
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
            <Text {...monoLabel}>Rebuild the sentence</Text>
            <Text fz={14} c="dimmed" mt={12}>
              Rewrite this sentence.
            </Text>
          </Box>

          <Section label="REPHRASED" warm>
            {simplified}
          </Section>

          <Textarea
            variant="unstyled"
            placeholder="Type your sentence…"
            autosize
            minRows={3}
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
            disabled={isSubmitting}
            styles={{
              input: { padding: "14px 15px", fontSize: 15, lineHeight: 1.5 },
            }}
            bd="1.5px dashed rgba(0,0,0,.22)"
            bdrs={14}
          />

          {evalError ? (
            <Text size="md" c="red">
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

          <Box p={16} bd={CARD_BORDER} bdrs={14}>
            <Text className="serif" fz={22} tt="capitalize">
              {word}
            </Text>
            <Text fz={14} lh={1.5} c="dimmed" mt={8}>
              {meaning}
            </Text>
          </Box>

          <Section label="REPHRASED" warm>
            {simplified}
          </Section>

          <Section label={generated ? "EXAMPLE" : "ORIGINAL"}>
            <UnderlineWord text={original} word={word} />
            {source ? (
              <Text span c="dimmed" fs="italic" fz={13} display="block" mt={4}>
                — {source}
              </Text>
            ) : null}
            {generated ? (
              <Text span c="dimmed" fs="italic" fz={13} display="block" mt={4}>
                Generated example — not from a published source.
              </Text>
            ) : null}
          </Section>

          <Section label="YOUR SENTENCE" tint={correct ? undefined : "red"}>
            {value.trim()}
          </Section>

          {evaluation.segments && evaluation.segments.length > 0 ? (
            <Section label="CORRECTIONS">
              {evaluation.segments.map((segment, i) =>
                segment.changed ? (
                  <Text key={i} span fw={700} bg="yellow.2" px={2}>
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
            <Section label="CORRECTIONS">
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
