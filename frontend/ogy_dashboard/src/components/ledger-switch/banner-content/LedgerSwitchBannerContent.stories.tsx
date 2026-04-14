import type { Meta, StoryObj } from "@storybook/react-vite";
import LedgerSwitchBannerContent from "./index";
import { Button } from "@components/ui";

const meta: Meta<typeof LedgerSwitchBannerContent> = {
  title: "Dashboard/LedgerSwitchBannerContent",
  component: LedgerSwitchBannerContent,
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="bg-ledger-switch bg-cover bg-center bg-black text-content p-12 rounded-[40px] shadow-[0px_10px_50px_0px_#06274926] w-full max-w-[1280px] mx-auto">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LedgerSwitchBannerContent>;

export const Default: Story = {
  render: () => (
    <LedgerSwitchBannerContent>
      <div className="flex justify-center mt-8">
        <Button>Login to swap tokens</Button>
      </div>
    </LedgerSwitchBannerContent>
  ),
};
