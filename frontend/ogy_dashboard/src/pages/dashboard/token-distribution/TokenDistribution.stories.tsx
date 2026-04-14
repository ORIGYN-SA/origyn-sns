import type { Meta, StoryObj } from "@storybook/react-vite";
import TokenDistribution from "./index";
import { withMockedQueries } from "../../../../.storybook/withMockedQueries";

const meta: Meta<typeof TokenDistribution> = {
  title: "Dashboard/Cards/TokenDistribution",
  component: TokenDistribution,
};

export default meta;
type Story = StoryObj<typeof TokenDistribution>;

const MOCK_HOLDERS = {
  data: Array.from({ length: 10 }, (_, i) => {
    const total = 1_000_000_000 - i * 50_000_000;
    return {
      principal: `aaaaa-aaaaa-aaaaa-aaaaa-${i.toString().padStart(3, "0")}`,
      total,
      string: {
        total: total.toLocaleString("en-US"),
        governanceBalance: (total / 2).toLocaleString("en-US"),
        ledgerBalance: (total / 2).toLocaleString("en-US"),
      },
    };
  }),
  totalHolders: 10000,
};

export const Loaded: Story = {
  decorators: [
    withMockedQueries((qc) => {
      qc.setQueryData(["listTokenDistribution", 10, 0], MOCK_HOLDERS);
      qc.setQueryData(["fetchTotalSupplyOGY"], {
        totalSupplyOGY: 13_702_526_202,
        totalSupplyOGYToString: "13,702,526,202",
      });
    }),
  ],
};

export const Loading: Story = {
  decorators: [withMockedQueries(() => {})],
};
