import { Box, Button, Center, Flex, Group, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { IconArrowUp, IconRefresh } from "@tabler/icons-react";
import {
  EVALUATION_ERROR_MESSAGE,
  HINT_DELAY_MS,
  NEAR_PERFECT_THRESHOLD,
} from "../constants";
import type { SentenceEvaluation } from "../sentenceTypes";
import type { StepOutcome } from "../../../store/session";
import { nextWord, useSessionStore } from "../../../store/session";
import { text } from "../../../theme/typography";
import { PracticeProgress } from "../practiceProgress";
import { ActionBar } from "../actionBar";
import { FeedbackHeader } from "../feedbackHeader";
import {
  HighlightPhrase,
  HintBanner,
  Section,
  SentenceHintsCTAs,
  UnderlineWord,
} from "./SentenceHelpers";
import { AnswerDrawer } from "../answerDrawer";
import { ConfirmRevealWordDrawer } from "./confirmRevealWordDrawer";

interface PracticeSentenceProps {
  word: string;
  display?: string;
  meaning: string;
  original: string;
  source: string;
  simplified: string | null;
  rephraseTarget: string | null;
  generated: boolean;
  generationFailed: boolean;
}

type ActionData = SentenceEvaluation | { error: true };

export const PracticeSentence = ({
  word,
  display,
  meaning,
  original,
  source,
  simplified,
  rephraseTarget,
  generated,
  generationFailed,
}: PracticeSentenceProps) => {
  const wordDisplay = display ?? word;
  const evalFetcher = useFetcher<ActionData>();
  const [value, setValue] = useState("");
  const [hintLevel, setHintLevel] = useState<-1 | 0 | 1 | 2 | 3>(-1);
  const [isConfirmSheetOpen, setIsConfirmSheetOpen] = useState(false);
  const [isAnswerSheetOpen, setIsAnswerSheetOpen] = useState(false);
  const navigate = useNavigate();
  const queue = useSessionStore((s) => s.queue);
  const meaningIds = useSessionStore((s) => s.meaningIds);
  const recordResult = useSessionStore((s) => s.recordResult);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setHintLevel((level) => (level < 0 ? 0 : level));
    }, HINT_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

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
    const outcome: StepOutcome =
      hintLevel === 3 ? "revealed" : isCorrect ? "correct" : "wrong";
    recordResult(word, "sentence", outcome, wordDisplay);
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
    <Flex direction="column" p={16} pb={110} gap={12} flex={1}>
      <PracticeProgress tone={tone} />

      {!evaluation ? (
        <>
          <Box>
            <Text {...text.label}>Rebuild the sentence</Text>
          </Box>

          <HighlightPhrase
            simplified={simplified}
            rephrasedTarget={rephraseTarget}
          />

          {(hintLevel === 1 || hintLevel === 2 || hintLevel === 3) && (
            <HintBanner word={wordDisplay} level={hintLevel} />
          )}

          <SentenceHintsCTAs
            hintLevel={hintLevel}
            onCTAHintClick={(nextLevel) => setHintLevel(nextLevel)}
            onConfirmReveal={() => setIsConfirmSheetOpen(true)}
          />

          {evalError ? (
            <Text {...text.body} c="red">
              {EVALUATION_ERROR_MESSAGE}
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
                rightSection={<IconArrowUp size={16} />}
                onClick={() => setIsAnswerSheetOpen(true)}>
                Answer
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
              {display}
            </Text>
            <Text {...text.bodySm} c="dimmed" mt={8}>
              {meaning}
            </Text>
          </Box>

          <Section warm>{simplified}</Section>

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

      <AnswerDrawer
        isOpen={isAnswerSheetOpen && !evaluation}
        onClose={() => setIsAnswerSheetOpen(false)}
        inputVariant="textarea"
        backdrop="readable"
        placeholder="Type your sentence…"
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errorMessage={evalError ? EVALUATION_ERROR_MESSAGE : undefined}
      />

      <ConfirmRevealWordDrawer
        isOpen={isConfirmSheetOpen}
        onClose={() => setIsConfirmSheetOpen(false)}
        onRevealWord={() => {
          setHintLevel(3);
          setIsConfirmSheetOpen(false);
        }}
      />
    </Flex>
  );
};
