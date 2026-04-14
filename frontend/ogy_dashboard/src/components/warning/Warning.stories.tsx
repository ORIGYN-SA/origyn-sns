import type { Meta, StoryObj } from "@storybook/react-vite";
import Warning from "./Warning";

const meta: Meta<typeof Warning> = {
  title: "Layout/Warning",
  component: Warning,
  parameters: {
    backgrounds: { default: "dark" },
  },
};

export default meta;
type Story = StoryObj<typeof Warning>;

export const Default: Story = {};
