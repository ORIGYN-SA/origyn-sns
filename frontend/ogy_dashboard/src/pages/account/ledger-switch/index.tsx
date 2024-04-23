import { ReactNode } from "react";
import { Tile } from "@components/ui";
import WithdrawLegacyTokens from "./withdraw-legacy-tokens";
import Deposit from "./deposit";
import SwapTokens from "./swap-tokens";

const LedgerSwitch = ({ className, ...restProps }) => {
  const cards = [
    {
      title: "Step 1: Withdraw from old governance",
      subtitle:
        "If you were previously participating in OGY governance, you need to withdraw those tokens before you can swap them.",
      children: (
        <div className="mt-4 xl:mt-8">
          <WithdrawLegacyTokens />
        </div>
      ),
    },
    {
      title: "Step 2: Deposit to your account",
      subtitle:
        "If you have any tokens outside of the OGY dashboard, deposit them to your account-id before you can start to swap them.",
      children: <Deposit />,
    },
    {
      title: "Step 3: Swap tokens",
      subtitle: "Swap the legacy OGY token to the new ledger.",
      children: (
        <div className="mt-4 xl:mt-8">
          <SwapTokens />
        </div>
      ),
    },
  ];

  return (
    <div className={className} {...restProps}>
      <div className="shadow-md">
        <div className="bg-charcoal text-white px-8 pt-8 pb-16 rounded-t-xl">
          <div className="text-center text-sm mb-16">
            IMPORTANT INFORMATION Ledger Switch
          </div>
          <div className="text-center text-4xl mb-8">
            We are switching ledger
          </div>
          <div className="grid xl:grid-cols-4">
            <div className="col-start-2 col-span-2 text-center">
              <p>ORIGYN governance and ledger have been upgraded to an SNS. </p>
              <p>
                In order to continue participating in ORIGYN governance and
                utilise OGY, you need to swap your OGY tokens.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface p-8 rounded-b-xl">
          <div className="grid xl:grid-cols-3 gap-8">
            {cards.map(({ title, subtitle, children }) => {
              return (
                <div
                  className="flex flex-col p-4 border border-surface-2 rounded-lg"
                  key={title}
                >
                  <div className="flex">
                    <Tile className="rounded-lg h-20 w-20 mr-4">X</Tile>
                    <div>
                      <div className="font-semibold">{title}</div>
                      <div className="text-content/60">{subtitle}</div>
                    </div>
                  </div>
                  <div>{children as ReactNode}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerSwitch;
