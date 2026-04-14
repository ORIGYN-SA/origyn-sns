import type { Meta, StoryObj } from "@storybook/react-vite";
import OrigynTreasuryAccount from "./OrigynTreasuryAccount";
import { withMockedQueries } from "../../../../.storybook/withMockedQueries";

const meta: Meta<typeof OrigynTreasuryAccount> = {
  title: "Dashboard/Cards/OrigynTreasuryAccount",
  component: OrigynTreasuryAccount,
};

export default meta;
type Story = StoryObj<typeof OrigynTreasuryAccount>;

export const Loaded: Story = {
  decorators: [
    withMockedQueries((qc) => {
      qc.setQueryData(["fetchLedgerAccountBalanceICP"], 12345);
      qc.setQueryData(["fetchLedgerOldAccountBalanceICP"], 0);
      qc.setQueryData(["fetchLedgerAccountBalanceOGY"], 99661463.92);
    }),
  ],
};

export const Loading: Story = {
  decorators: [withMockedQueries(() => {})],
};
