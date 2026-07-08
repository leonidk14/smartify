import { readVocabulary } from "./wordSearch/vocabulary.server";
import { PracticeSentence } from "./practice/practiceSentence";
import {
  evaluateSentence,
  generateSentence,
} from "./practice/sentenceActions.server";
import type { SentenceEvaluation } from "./practice/sentenceTypes";
import type { Route } from "./+types/practiceSentence";

export const shouldRevalidate = () => {
  return false;
};

export async function loader({ params, request }: Route.LoaderArgs) {
  const vocabulary = await readVocabulary();
  const entry = vocabulary[params.word];

  if (!entry) {
    throw new Response("Word not found", { status: 404 });
  }

  const meanings = entry.groups.flatMap((g) =>
    g.meanings.map((m) => m.definition),
  );

  const requestedMeaning = new URL(request.url).searchParams.get("m");
  const meaning =
    requestedMeaning && meanings.includes(requestedMeaning)
      ? requestedMeaning
      : meanings[Math.floor(Math.random() * meanings.length)];

  try {
    const { sentence } = await generateSentence(params.word, meaning, meanings);

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
      simplified: sentence.simplified,
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

export async function action({
  request,
  params,
}: Route.ActionArgs): Promise<SentenceEvaluation | { error: true }> {
  const formData = await request.formData();
  const meaning = String(formData.get("meaning"));
  const original = String(formData.get("original"));
  const userSentence = String(formData.get("sentence")).trim();

  try {
    const { evaluation } = await evaluateSentence(
      params.word,
      meaning,
      original,
      userSentence,
    );
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
