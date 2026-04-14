import type { Meta, StoryObj } from "@storybook/react-vite";
import Stat from "./Stat";

const meta: Meta<typeof Stat> = {
  title: "Dashboard/Stat",
  component: Stat,
};

export default meta;
type Story = StoryObj<typeof Stat>;

export const WithIconAndUnit: Story = {
  args: {
    iconSrc: "/ogy_logo.svg",
    value: "13,702,526,202",
    unit: "OGY",
  },
};

export const WithoutIcon: Story = {
  args: {
    value: "5,678",
    unit: "wallets",
  },
};

export const NumberOnly: Story = {
  args: {
    value: "12,345",
  },
};

export const VeryLongNumber: Story = {
  args: {
    iconSrc: "/ogy_logo.svg",
    value: "1,234,567,890,123,456,789",
    unit: "OGY",
  },
};
