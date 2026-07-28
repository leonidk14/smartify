import { Suspense } from "react";
import { Await } from "react-router";
import { Flex, Loader, Text } from "@mantine/core";
import { readVocabulary } from "./wordSearch/vocabulary";
import { useBlockBack } from "../lib/useBlockBack";
import { PracticeSentence } from "./practice/practiceSentence";
import { text } from "../theme/typography";
import { evaluateSentence, generateSentence } from "./practice/sentenceActions";
import type { SentenceEvaluation } from "./practice/sentenceTypes";
import type { Route } from "./+types/practiceSentence";

interface SentenceData {
  meaning: string;
  original: string;
  source: string;
  simplified: string | null;
  generated: boolean;
  generationFailed: boolean;
}

const failedSentence = (meaning: string): SentenceData => ({
  meaning,
  original: "",
  source: "",
  simplified: "",
  generated: false,
  generationFailed: true,
});

export const shouldRevalidate = ({
  currentUrl,
  nextUrl,
}: {
  currentUrl: URL;
  nextUrl: URL;
}) => {
  const isNavigatingToDifferentSentence =
    currentUrl.pathname !== nextUrl.pathname ||
    currentUrl.search !== nextUrl.search;

  return isNavigatingToDifferentSentence;
};

export async function clientLoader({
  params,
  request,
}: Route.ClientLoaderArgs) {
  const { store: vocabulary } = await readVocabulary();
  const entry = vocabulary[params.word];

  if (!entry) {
    throw new Response("Word not found", { status: 404 });
  }

  const allMeanings = entry.groups.flatMap((g) =>
    Object.entries(g.meanings).map(([id, m]) => ({
      id,
      definition: m.definition,
    })),
  );
  const meanings = allMeanings.map((m) => m.definition);

  const requestedId = new URL(request.url).searchParams.get("m");
  const selected =
    allMeanings.find((m) => m.id === requestedId) ??
    allMeanings[Math.floor(Math.random() * allMeanings.length)];
  const meaning = selected.definition;

  const sentence: Promise<SentenceData> = generateSentence({
    word: params.word,
    meaningId: selected.id,
    meaningDefinition: meaning,
    meanings,
  })
    .then(({ sentence }): SentenceData => {
      if (sentence.error) {
        console.error("Sentence generation failed", sentence.error);
        return failedSentence(meaning);
      }

      return {
        meaning: sentence.meaning ?? meaning,
        original: sentence.original,
        source: sentence.source,
        simplified: sentence.simplified ?? null,
        generated: sentence.generated ?? false,
        generationFailed: false,
      };
    })
    .catch((e): SentenceData => {
      console.error("Sentence generation failed", e);
      return failedSentence(meaning);
    });

  return { word: params.word, sentence };
}

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs): Promise<SentenceEvaluation | { error: true }> {
  const formData = await request.formData();
  const meaning = String(formData.get("meaning"));
  const original = String(formData.get("original"));
  const userSentence = String(formData.get("sentence")).trim();

  try {
    const { evaluation } = await evaluateSentence({
      word: params.word,
      meaning,
      original,
      userSentence,
    });
    return evaluation;
  } catch (e) {
    console.error("Sentence evaluation failed", e);
    return { error: true };
  }
}

function BuildingSentence() {
  return (
    <Flex direction="column" align="center" justify="center" gap={16} flex={1}>
      <Loader color="dark" size="lg" />
      <Text {...text.body} c="dimmed">
        Building your sentence…
      </Text>
    </Flex>
  );
}

export default function PracticeSentenceRoute({
  loaderData,
}: Route.ComponentProps) {
  useBlockBack("You can't go back during practice.");

  return (
    <Suspense key={loaderData.word} fallback={<BuildingSentence />}>
      <Await resolve={loaderData.sentence}>
        {(sentence) => (
          <PracticeSentence
            word={loaderData.word}
            meaning={sentence.meaning}
            original={sentence.original}
            source={sentence.source}
            simplified={sentence.simplified}
            generated={sentence.generated}
            generationFailed={sentence.generationFailed}
          />
        )}
      </Await>
    </Suspense>
  );
}
