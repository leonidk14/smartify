import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ActionFunction } from "react-router";
import { withAuth, withRouter } from "../../.storybook/decorators";
import Home, { clientAction } from "./home";

// The generated ClientActionArgs is wider than a plain ActionFunction's args.
// `serverAction` is unreachable in SPA mode (ssr: false) and clientAction never
// calls it, so it only has to exist.
const action: ActionFunction = (args) =>
  clientAction({
    ...args,
    serverAction: () =>
      Promise.reject(new Error("No server action in Storybook")),
  });

const meta = {
  component: Home,
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HomeSignedIn: Story = {
  decorators: [withRouter({ action }), withAuth({ isSignedIn: true })],
};
