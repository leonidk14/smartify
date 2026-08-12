import type { Decorator } from "@storybook/react-vite";
import {
  createMemoryRouter,
  RouterProvider,
  type ActionFunction,
} from "react-router";
import { AuthContext, type AuthContextValue } from "~/lib/authContext";
import Layout, { type clientLoader } from "~/routes/layout";
import Practice from "~/routes/practice";
import { vocabularyFixture } from "./fixtures/vocabulary";

type VocabularyLoaderData = Awaited<ReturnType<typeof clientLoader>>;

interface RouterOptions {
  loaderData?: VocabularyLoaderData;
  action?: ActionFunction;
}

const signedOut: AuthContextValue = {
  session: null,
  user: null,
  isSignedIn: false,
  isReady: true,
  signIn: () => Promise.resolve({ error: null }),
  signOut: () => Promise.resolve(),
  openSignIn: () => {},
  closeSignIn: () => {},
  isSignInOpen: false,
};

export const withAuth =
  (overrides: Partial<AuthContextValue> = {}): Decorator =>
  (Story) => (
    <AuthContext value={{ ...signedOut, ...overrides }}>
      <Story />
    </AuthContext>
  );

// The story sits where `home.tsx` sits in `routes.ts`: an index route under the
// layout. The parent's `id` has to be "routes/layout" verbatim, because that is
// the string `useVocabulary` passes to `useRouteLoaderData`.
export const withRouter =
  ({
    loaderData = { store: vocabularyFixture, isFromOfflineCopy: false },
    action,
  }: RouterOptions = {}): Decorator =>
  (Story) => (
    <RouterProvider
      router={createMemoryRouter(
        [
          {
            path: "/",
            id: "routes/layout",
            loader: () => loaderData,
            Component: Layout,
            children: [
              { index: true, Component: Story, action },
              // Practice needs no loader of its own — like the story, it reads
              // the layout's vocabulary through useVocabulary().
              { path: "practice", Component: Practice },
            ],
          },
        ],
        { initialEntries: ["/"] },
      )}
    />
  );
