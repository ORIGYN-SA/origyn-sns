import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import PeriodSelect from "./PeriodSelect";

const meta: Meta<typeof PeriodSelect> = {
  title: "Dashboard/PeriodSelect",
  component: PeriodSelect,
};

export default meta;
type Story = StoryObj<typeof PeriodSelect>;

const OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const Interactive = ({ initial = "weekly" }: { initial?: string }) => {
  const [value, setValue] = useState(initial);
  return (
    <PeriodSelect options={OPTIONS} value={value} onChange={setValue} />
  );
};

export const Default: Story = {
  render: () => <Interactive />,
};

export const StartsOnDaily: Story = {
  render: () => <Interactive initial="daily" />,
};

export const StartsOnYearly: Story = {
  render: () => <Interactive initial="yearly" />,
};
