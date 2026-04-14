import type { Meta, StoryObj } from "@storybook/react-vite";
import TotalOGYSupply from "./TotalOGYSupply";
import { withMockedQueries } from "../../../../.storybook/withMockedQueries";

const meta: Meta<typeof TotalOGYSupply> = {
  title: "Dashboard/Cards/TotalOGYSupply",
  component: TotalOGYSupply,
  args: {
    className: "h-[450px]",
  },
  decorators: [
    (Story) => (
      <div className="max-w-[700px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TotalOGYSupply>;

const MOCK_TIME_SERIES = [
  { name: "Apr 01", value: 6800000000 },
  { name: "Apr 03", value: 6810000000 },
  { name: "Apr 05", value: 6850000000 },
  { name: "Apr 07", value: 6890000000 },
  { name: "Apr 09", value: 6920000000 },
  { name: "Apr 11", value: 6940000000 },
  { name: "Apr 13", value: 6957000000 },
];

export const Loaded: Story = {
  decorators: [
    withMockedQueries((qc) => {
      qc.setQueryData(["fetchTotalSupplyOGY"], {
        totalSupplyOGY: 1370252620266000000,
        totalSupplyOGYToString: "13,702,526,202",
      });
      qc.setQueryData(
        ["fetchTotalSupplyOGYTimeSeries", "weekly"],
        { totalSupplyOGYTimeSeries: MOCK_TIME_SERIES }
      );
    }),
  ],
};

export const Loading: Story = {
  decorators: [withMockedQueries(() => {})],
};
