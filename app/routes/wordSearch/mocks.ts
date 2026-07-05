import type { LookupResult } from "./actions";

const HAIKU_INPUT_PRICE_PER_TOKEN = 1.0 / 1_000_000;
const HAIKU_OUTPUT_PRICE_PER_TOKEN = 5.0 / 1_000_000;

function entry(
  meanings: string[],
  inputTokens: number,
  outputTokens: number,
): LookupResult {
  const inputCost = inputTokens * HAIKU_INPUT_PRICE_PER_TOKEN;
  const outputCost = outputTokens * HAIKU_OUTPUT_PRICE_PER_TOKEN;
  return {
    dictionary: { meaning: meanings },
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
    },
  };
}

export const MOCK_RESPONSES: Record<string, LookupResult> = {
  oblivious: entry(
    [
      "(adjective) Not aware of or not noticing something; lacking knowledge or consciousness of.",
      "(adjective) Lacking memory or recollection; forgetful.",
    ],
    239,
    48,
  ),

  impudence: entry(
    [
      "(noun) Disrespectful or impertinent behaviour or speech; lack of proper respect or courtesy.",
      "(noun) Boldness or audacity that is considered inappropriate or offensive.",
    ],
    239,
    52,
  ),

  precarious: entry(
    [
      "(adjective) Not safely held or in a secure position; liable to fall or give way.",
      "(adjective) Dependent on chance or uncertain circumstances; not securely established.",
      "(adjective) Uncertain or unstable in tenure or position, especially of employment or livelihood.",
    ],
    238,
    71,
  ),

  perilously: entry(
    [
      "(adverb) In a manner that is exposed to or involving danger; dangerously.",
      "(adverb) In a precarious or unstable manner; precariously.",
    ],
    239,
    51,
  ),

  stridency: entry(
    [
      "(noun) The quality of being loud, harsh, or shrill in sound.",
      "(noun) The quality of being loud, emphatic, or forceful in manner or expression, especially in a way regarded as unpleasantly aggressive or insistent.",
    ],
    239,
    65,
  ),

  apoplectic: entry(
    [
      "(adjective) Relating to or characteristic of apoplexy; affected by or liable to apoplexy.",
      "(adjective) Furiously angry; enraged to the point of loss of self-control.",
    ],
    239,
    57,
  ),

  swell: entry(
    [
      "(verb) To increase in size, volume, or extent; to become larger or distended.",
      "(verb) To rise and roll in undulating motions, as waves or water.",
      "(verb) To grow or increase in intensity, amount, or degree.",
      "(verb) To cause to increase in size or volume; to make larger or distended.",
      "(noun) A long undulating wave or succession of waves on the ocean surface, typically following a storm or strong wind.",
      "(noun) A gradual increase in intensity, volume, or loudness, particularly of music or sound.",
      "(noun) The act or process of swelling; the state of being swollen.",
      "(adjective) Fashionable, stylish, or elegant; of high social status or distinction.",
      "(adjective) Excellent or admirable; fine or splendid.",
    ],
    238,
    188,
  ),

  plunge: entry(
    [
      "(verb) To dive or jump into water or another liquid with force.",
      "(verb) To thrust or push suddenly and forcefully into something.",
      "(verb) To fall or drop suddenly and steeply.",
      "(verb) To enter suddenly or rashly into a situation or course of action.",
      "(noun) An act of plunging; a dive or jump.",
      "(noun) A sudden fall or drop in amount, value, or condition.",
    ],
    238,
    103,
  ),
};

export const MOCK_ERROR_RESPONSE: LookupResult = entry([], 243, 8);
