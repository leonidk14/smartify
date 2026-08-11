import type { Decorator } from "@storybook/react-vite";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthContextValue } from "../app/lib/authContext";

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

export const withRouter: Decorator = (Story) => (
  <RouterProvider
    router={createMemoryRouter([{ path: "*", Component: Story }], {
      initialEntries: ["/practice"],
    })}
  />
);
