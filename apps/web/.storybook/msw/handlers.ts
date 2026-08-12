import { delay, http, HttpResponse, type PathParams } from "msw";
import type {
  StoredMeaningGroup,
  VocabularyEntry,
} from "~/routes/wordSearch/vocabulary";
import { lookupFixture, vocabularyFixture } from "../fixtures/vocabulary";

// Matches the base `main.ts` pins VITE_SUPABASE_URL to for Storybook.
const functionUrl = (name: string) =>
  `http://supabase.test/functions/v1/${name}`;

interface SaveRequest {
  word: string;
  display: string;
  typed: string;
  groups: StoredMeaningGroup[];
}

export const handlers = [
  http.post(functionUrl("vocabulary-list"), () =>
    HttpResponse.json({ store: vocabularyFixture }),
  ),

  http.post<PathParams, SaveRequest>(
    functionUrl("vocabulary-save"),
    async ({ request }) => {
      const { display, typed, groups } = await request.json();
      const entry: VocabularyEntry = {
        groups,
        display,
        typed,
        shouldPracticeLater: false,
        savedAt: new Date().toISOString(),
        isPublic: false,
      };
      return HttpResponse.json({ entry });
    },
  ),

  http.post(functionUrl("vocabulary-mark-practice"), () =>
    HttpResponse.json({}),
  ),

  http.post(functionUrl("vocabulary-delete"), () => HttpResponse.json({})),

  http.get<{ slug: string }>(
    functionUrl("lookup/:slug"),
    async ({ params }) => {
      // A visible delay so the "Searching…" loader is observable in the lookup
      // story's play test, not a sub-frame flash.
      await delay(1000);
      return HttpResponse.json(lookupFixture(params.slug.replace(/-/g, " ")));
    },
  ),
];
