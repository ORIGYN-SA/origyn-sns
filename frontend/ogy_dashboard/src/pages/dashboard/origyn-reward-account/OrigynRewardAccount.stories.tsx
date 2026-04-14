import type { Meta, StoryObj } from "@storybook/react-vite";
import OrigynRewardAccount from "./index";
import { SNS_REWARDS_CANISTER_ID } from "@constants/index";
import { withMockedQueries } from "../../../../.storybook/withMockedQueries";

const meta: Meta<typeof OrigynRewardAccount> = {
  title: "Dashboard/Cards/OrigynRewardAccount",
  component: OrigynRewardAccount,
};

export default meta;
type Story = StoryObj<typeof OrigynRewardAccount>;

const REWARD_SUBACCOUNT =
  "0100000000000000000000000000000000000000000000000000000000000000";

export const Loaded: Story = {
  decorators: [
    withMockedQueries((qc) => {
      qc.setQueryData(
        ["fetchBalanceOGY", SNS_REWARDS_CANISTER_ID, REWARD_SUBACCOUNT],
        {
          number: { balance: 1_000_000_000 },
          string: { balance: "1,000,000,000" },
        }
      );
    }),
  ],
};

export const Loading: Story = {
  decorators: [withMockedQueries(() => {})],
};
