import type { Meta, StoryObj } from "@storybook/react-vite";
import TotalOGYBurned from "./TotalOGYBurned";
import { withMockedQueries } from "../../../../.storybook/withMockedQueries";

const meta: Meta<typeof TotalOGYBurned> = {
  title: "Dashboard/Cards/TotalOGYBurned",
  component: TotalOGYBurned,
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
type Story = StoryObj<typeof TotalOGYBurned>;

const MOCK_TIME_SERIES = [
  { name: "Apr 01", value: 200000 },
  { name: "Apr 03", value: 210000 },
  { name: "Apr 05", value: 250000 },
  { name: "Apr 07", value: 290000 },
  { name: "Apr 09", value: 320000 },
  { name: "Apr 11", value: 340000 },
  { name: "Apr 13", value: 357000 },
];

export const Loaded: Story = {
  decorators: [
    withMockedQueries((qc) => {
      qc.setQueryData(["fetchTotalBurnedOGY"], {
        totalBurnedOGY: 35700000000,
        totalBurnedOGYToString: "357",
      });
      qc.setQueryData(
        ["fetchTotalBurnedOGYTimeSeries", "weekly"],
        { totalBurnedOGYTimeSeries: MOCK_TIME_SERIES }
      );
    }),
  ],
};

export const Loading: Story = {
  decorators: [withMockedQueries(() => {})],
};
