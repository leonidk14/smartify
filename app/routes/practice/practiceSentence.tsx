import { Badge, Box, Button, Flex, Text, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { NEAR_PERFECT_THRESHOLD } from "./constants";
import type { SentenceEvaluation } from "./sentenceTypes";

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

const notify = (color: string, message: string) =>
  notifications.show({
    color,
    message,
    autoClose: 2500,
    styles: { description: { fontSize: "var(--mantine-font-size-lg)" } },
  });

const Comparison = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Box>
    <Text size="sm" c="dimmed" tt="uppercase" fw={600} mb={4}>
      {label}
    </Text>
    <Text size="xl">{children}</Text>
  </Box>
);

export const PracticeSentence = ({
  meaning,
  original,
  source,
  simplified,
  generated,
  generationFailed,
}: PracticeSentenceProps) => {
  const evalFetcher = useFetcher<ActionData>();
  const [value, setValue] = useState("");

  const isSubmitting = evalFetcher.state !== "idle";
  const data = evalFetcher.data;
  const evalError = !!data && "error" in data;
  const evaluation = data && !("error" in data) ? data : null;

  useEffect(() => {
    if (evaluation && evaluation.score >= NEAR_PERFECT_THRESHOLD) {
      notify("green", "Nicely done — that reads naturally!");
    }
  }, [evaluation]);

  const handleSubmit = () => {
    const sentence = value.trim();
    if (!sentence || isSubmitting) return;
    evalFetcher.submit({ sentence, meaning, original }, { method: "post" });
  };

  if (generationFailed) {
    return (
      <Flex
        direction="column"
        p={16}
        gap={16}
        flex={1}
        align="center"
        justify="center">
        <Text size="md">Something went wrong finding a sentence :(</Text>
        <Button
          variant="outline"
          size="lg"
          color="dark"
          onClick={() => window.location.reload()}>
          Try again
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" p={16} gap={16} flex={1}>
      <Text size="sm" c="dimmed">
        Rebuild this sentence naturally — using the word you just practiced.
      </Text>
      <Text size="xl" fw={700}>
        {simplified}
      </Text>

      <Textarea
        variant="unstyled"
        placeholder="Type your sentence..."
        size="xl"
        autosize
        minRows={2}
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        disabled={isSubmitting || !!evaluation}
        style={{ borderBottom: "1px solid #dee2e6" }}
      />

      {evalError ? (
        <Text size="md" c="red">
          We couldn't grade that — please try again.
        </Text>
      ) : null}

      {evaluation ? (
        <Flex direction="column" gap={24} mt={8}>
          <Flex align="center" gap={8}>
            <Text size="lg" fw={700}>
              Score
            </Text>
            <Badge
              size="xl"
              variant="filled"
              color={
                evaluation.score >= NEAR_PERFECT_THRESHOLD ? "green" : "dark"
              }>
              {evaluation.score.toFixed(1)} / 10
            </Badge>
          </Flex>

          <Comparison label={generated ? "Example" : "Original"}>
            {original}
            {source ? (
              <Text
                span
                c="dimmed"
                fs="italic"
                style={{ display: "block", fontSize: "var(--mantine-font-size-sm)" }}
                mt={4}>
                — {source}
              </Text>
            ) : null}
            {generated ? (
              <Text
                span
                c="dimmed"
                fs="italic"
                style={{ display: "block", fontSize: "var(--mantine-font-size-sm)" }}
                mt={4}>
                Generated example — not from a published source.
              </Text>
            ) : null}
          </Comparison>
          <Comparison label="Your sentence">{value.trim()}</Comparison>
          {evaluation.correctedSentence ? (
            <Comparison label="Corrected">
              {evaluation.segments ? (
                evaluation.segments.map((segment, i) =>
                  segment.changed ? (
                    <Text key={i} span fw={700} bg="yellow.2" px={2}>
                      {segment.text}
                    </Text>
                  ) : (
                    <Text key={i} span>
                      {segment.text}
                    </Text>
                  ),
                )
              ) : (
                <>{evaluation.correctedSentence}</>
              )}
            </Comparison>
          ) : null}
        </Flex>
      ) : null}

      {evaluation ? null : (
        <Box
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background:
              "linear-gradient(to bottom, rgba(255, 255, 255, 0), #fff 16px)",
            paddingTop: 32,
            paddingBottom: 16,
            display: "flex",
            justifyContent: "center",
            gap: 16,
          }}>
          <Button
            variant="filled"
            size="lg"
            color="black"
            type="button"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!value.trim()}>
            Check sentence
          </Button>
        </Box>
      )}
    </Flex>
  );
};
