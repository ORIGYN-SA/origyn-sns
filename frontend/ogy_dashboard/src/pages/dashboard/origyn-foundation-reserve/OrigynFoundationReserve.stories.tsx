import type { Meta, StoryObj } from "@storybook/react-vite";
import OrigynFoundationReserve from "./OrigynFoundationReserve";
import { PieChartProvider } from "@components/charts/pie/context";
import { withMockedQueries } from "../../../../.storybook/withMockedQueries";

const meta: Meta<typeof OrigynFoundationReserve> = {
  title: "Dashboard/Cards/OrigynFoundationReserve",
  component: OrigynFoundationReserve,
  decorators: [
    (Story) => (
      <div className="max-w-[700px]">
        <PieChartProvider>
          <Story />
        </PieChartProvider>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OrigynFoundationReserve>;

export const Loaded: Story = {
  decorators: [
    withMockedQueries((qc) => {
      qc.setQueryData(["foundationAssets"], {
        total: 6744999999.98,
        total_locked: 5000000000,
        total_rewards: 0,
        total_staked: 4250000000,
        total_unlocked: 1744999999.98,
      });
    }),
  ],
};

export const Loading: Story = {
  decorators: [withMockedQueries(() => {})],
};
