import type { Meta, StoryObj } from "@storybook/react-vite";
import OGYCirculationState from "./OGYCirculationState";
import { PieChartProvider } from "@components/charts/pie/context";
import { withMockedQueries } from "../../../../.storybook/withMockedQueries";

const meta: Meta<typeof OGYCirculationState> = {
  title: "Dashboard/Cards/OGYCirculationState",
  component: OGYCirculationState,
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
type Story = StoryObj<typeof OGYCirculationState>;

export const Loaded: Story = {
  decorators: [
    withMockedQueries((qc) => {
      qc.setQueryData(["circulationStateOGY"], {
        total_supply: BigInt("1370252620266000000"),
        circulating_supply: BigInt("695752620266000000"),
      });
      qc.setQueryData(["foundationAssets"], {
        total_locked: 6744999999.98,
      });
    }),
  ],
};

export const Loading: Story = {
  decorators: [withMockedQueries(() => {})],
};
