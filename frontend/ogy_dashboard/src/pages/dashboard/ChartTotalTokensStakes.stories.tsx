import type { Meta, StoryObj } from "@storybook/react-vite";
import ChartTotalTokensStakes from "./ChartTotalTokensStakes";
import { withMockedQueries } from "../../../.storybook/withMockedQueries";

const meta: Meta<typeof ChartTotalTokensStakes> = {
  title: "Dashboard/Cards/ChartTotalTokensStakes",
  component: ChartTotalTokensStakes,
};

export default meta;
type Story = StoryObj<typeof ChartTotalTokensStakes>;

const todayInDays = Math.floor(Date.now() / 86400000);
const MOCK_RAW: Array<[bigint, { balance: bigint }]> = Array.from(
  { length: 14 },
  (_, i) => [
    BigInt(todayInDays - 13 + i),
    { balance: BigInt(`${4_100_000_000 + i * 12_000_000}00000000`) },
  ]
);

export const Loaded: Story = {
  decorators: [
    withMockedQueries((qc) => {
      qc.setQueryData(["totalTokensStakes"], MOCK_RAW);
    }),
  ],
};

export const Loading: Story = {
  decorators: [withMockedQueries(() => {})],
};
