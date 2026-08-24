import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ActionFunction } from "react-router";
import { expect, userEvent, within } from "storybook/test";
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

export const HomeLookupHappyPath: Story = {
  decorators: [withRouter({ action }), withAuth({ isSignedIn: true })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole("button", { name: /look up a new word/i }),
    );

    await userEvent.type(await canvas.findByRole("searchbox"), "ephemeral");
    await userEvent.click(canvas.getByRole("button", { name: "Search" }));

    await expect(
      await canvas.findByText(/searching for the meaning/i),
    ).toBeVisible();

    await expect(
      await canvas.findByRole(
        "heading",
        { level: 2, name: "ephemeral" },
        { timeout: 10000 },
      ),
    ).toBeVisible();
    await expect(
      await canvas.findByText(/placeholder definition of/i, undefined, {
        timeout: 10000,
      }),
    ).toBeVisible();
  },
};

export const HomeOpensSavedMultiWordEntry: Story = {
  decorators: [withRouter({ action }), withAuth({ isSignedIn: true })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: /^to swell/i }));

    const panel = within(await canvas.findByTestId("lookup-panel"));

    await expect(panel.getByRole("searchbox")).toHaveValue("to swell");

    await expect(
      panel.getByRole("heading", { level: 2, name: "to swell" }),
    ).toBeVisible();
    await expect(panel.getByText(/to become larger or rounder/i)).toBeVisible();
    await expect(panel.queryByText("Suggestions")).toBeNull();
  },
};
