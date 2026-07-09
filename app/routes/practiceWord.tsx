import { readVocabulary } from "./wordSearch/vocabulary.server";
import { PracticeWord } from "./practice/practiceWord";
import type { Route } from "./+types/practiceWord";

export async function loader({ params }: Route.LoaderArgs) {
  const vocabulary = await readVocabulary();
  const entry = vocabulary[params.word];

  if (!entry) {
    throw new Response("Word not found", { status: 404 });
  }

  const allMeanings = entry.groups.flatMap((g) =>
    Object.entries(g.meanings).map(([id, m]) => ({
      id,
      definition: m.definition,
      partOfSpeech: g.part_of_speech,
    })),
  );
  const selected = allMeanings[Math.floor(Math.random() * allMeanings.length)];

  const otherWords = Object.entries(vocabulary).filter(
    ([key, v]) => key !== params.word && v.groups.length > 0,
  );

  const samePos = otherWords.filter(([, v]) =>
    v.groups.some((g) => g.part_of_speech === selected.partOfSpeech),
  );

  const pool = [...samePos];

  const shuffled = pool.sort(() => Math.random() - 0.5);
  const decoys = shuffled.slice(0, 2).map(([key]) => key);
  const hints = buildHints({ correct: params.word, decoys });

  return {
    word: params.word,
    definition: selected.definition,
    meaningId: selected.id,
    hints,
  };
}

function buildHints({
  correct,
  decoys,
}: {
  correct: string;
  decoys: string[];
}): string[] {
  const result = [...decoys.slice(0, 2)];
  const index = Math.floor(Math.random() * 3);
  result.splice(index, 0, correct);
  return result;
}

export default function PracticeWordRoute({
  loaderData,
}: Route.ComponentProps) {
  return (
    <PracticeWord
      word={loaderData.word}
      definition={loaderData.definition}
      meaningId={loaderData.meaningId}
      hints={loaderData.hints}
    />
  );
}
