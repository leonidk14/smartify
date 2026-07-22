import { readVocabulary } from "./wordSearch/vocabulary";
import { PracticeSentence } from "./practice/practiceSentence";
import { evaluateSentence, generateSentence } from "./practice/sentenceActions";
import type { SentenceEvaluation } from "./practice/sentenceTypes";
import type { Route } from "./+types/practiceSentence";

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

  try {
    const { sentence } = await generateSentence({
      word: params.word,
      meaningId: selected.id,
      meaningDefinition: meaning,
      meanings,
    });

    if (sentence.error) {
      console.error("Sentence generation failed", sentence.error);
      return {
        word: params.word,
        meaning,
        original: "",
        source: "",
        simplified: "",
        generated: false,
        error: true,
      };
    }

    return {
      word: params.word,
      meaning: sentence.meaning ?? meaning,
      original: sentence.original,
      source: sentence.source,
      simplified: sentence.simplified ?? null,
      generated: sentence.generated ?? false,
      error: false,
    };
  } catch (e) {
    console.error("Sentence generation failed", e);
    return {
      word: params.word,
      meaning,
      original: "",
      source: "",
      simplified: "",
      generated: false,
      error: true,
    };
  }
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

export default function PracticeSentenceRoute({
  loaderData,
}: Route.ComponentProps) {
  return (
    <PracticeSentence
      key={loaderData.word}
      word={loaderData.word}
      meaning={loaderData.meaning}
      original={loaderData.original}
      source={loaderData.source}
      simplified={loaderData.simplified}
      generated={loaderData.generated}
      generationFailed={loaderData.error}
    />
  );
}
