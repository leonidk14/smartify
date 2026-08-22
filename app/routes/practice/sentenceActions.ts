import { logTokenUsage } from "../wordSearch/usage";
import { postFunction } from "../../lib/supabaseFunctions";
import type { EvaluationResult, SentenceGeneration } from "./sentenceTypes";

export async function generateSentence({
  word,
  meaningId,
  meaningDefinition,
  meanings,
}: {
  word: string;
  meaningId: string;
  meaningDefinition: string;
  meanings: string[];
}): Promise<SentenceGeneration> {
  const { sentence, usage, source } = await postFunction<
    SentenceGeneration & { source: string }
  >("generate-sentence", { word, meaningId, meaningDefinition, meanings });

  logTokenUsage({ usage, label: `generate (${source}): ${word}` });
  return { sentence, usage };
}

export async function evaluateSentence({
  word,
  meaning,
  original,
  userSentence,
}: {
  word: string;
  meaning: string;
  original: string;
  userSentence: string;
}): Promise<EvaluationResult> {
  const { evaluation, usage, source } = await postFunction<
    EvaluationResult & { source: string }
  >("evaluate-sentence", { word, meaning, original, userSentence });

  logTokenUsage({ usage, label: `evaluate (${source}): ${word}` });
  return { evaluation, usage };
}
