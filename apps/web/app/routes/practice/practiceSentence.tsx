import {
  ActionIcon,
  Box,
  Button,
  Center,
  Drawer,
  Flex,
  Group,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { IconBulb, IconRefresh, IconX } from "@tabler/icons-react";
import { HINT_DELAY_MS, NEAR_PERFECT_THRESHOLD } from "./constants";
import type { SentenceEvaluation } from "./sentenceTypes";
import type { StepOutcome } from "../../store/session";
import { nextWord, useSessionStore } from "../../store/session";
import { text, textCss } from "../../theme/typography";
import { PracticeProgress } from "./practiceProgress";
import { ActionBar } from "./actionBar";
import { FeedbackHeader } from "./feedbackHeader";
import {
  HighlightPhrase,
  HintBanner,
  Section,
  UnderlineWord,
} from "./SentenceHelpers";

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

          <HighlightPhrase
            simplified={simplified}
            rephrasedTarget={rephraseTarget}
          />

          {(hintLevel === 1 || hintLevel === 2 || hintLevel === 3) && (
            <HintBanner word={wordDisplay} level={hintLevel} />
          )}

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
                onClick={() => setHintLevel(1)}>
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
                onClick={() => setHintLevel(2)}>
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
                onClick={() => setIsConfirmSheetOpen(true)}>
                Reveal the whole word
              </Button>
            </Group>
          )}
          {hintLevel === 3 && (
            <Text {...text.meta} c="var(--color-warning)">
              You revealed the word — this one won't be scored.
            </Text>
          )}

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
              {display}
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

      <Drawer
        opened={isConfirmSheetOpen}
        onClose={() => setIsConfirmSheetOpen(false)}
        position="bottom"
        size={250}
        zIndex={300}
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.35 }}
        radius={0}
        styles={{
          content: { borderRadius: "24px 24px 0 0" },
          body: { padding: "14px 20px 24px" },
        }}>
        <Stack gap={16}>
          <Flex justify="flex-end">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="md"
              aria-label="Close"
              type="button"
              onClick={() => setIsConfirmSheetOpen(false)}>
              <IconX size={22} />
            </ActionIcon>
          </Flex>
          <Box>
            <Text {...text.headline}>Reveal the whole word?</Text>
            <Text {...text.bodySm} c="dimmed" mt={8}>
              This forfeits scoring for this word — it won't count as correct or
              wrong in your summary.
            </Text>
          </Box>
          <Group gap={10} wrap="nowrap">
            <Button
              variant="outline"
              color="dark"
              h={48}
              radius={12}
              flex={1}
              onClick={() => setIsConfirmSheetOpen(false)}>
              Keep trying
            </Button>
            <Button
              variant="filled"
              color="black"
              h={48}
              radius={12}
              flex={1}
              onClick={() => {
                setHintLevel(3);
                setIsConfirmSheetOpen(false);
              }}>
              Reveal the word
            </Button>
          </Group>
        </Stack>
      </Drawer>
    </Flex>
  );
};
