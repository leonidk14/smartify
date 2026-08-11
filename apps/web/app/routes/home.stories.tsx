import type { Meta, StoryObj } from "@storybook/react-vite";
import { withAuth, withRouter } from "../../.storybook/decorators";
import Home from "./home";

const meta = {
  component: Home,
  decorators: [withRouter],
  //   args: { total: 12, markedCount: 3 },
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HomeSignedOut: Story = {
  decorators: [withAuth()],
};
