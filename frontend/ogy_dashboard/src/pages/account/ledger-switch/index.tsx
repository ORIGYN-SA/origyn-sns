/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ReactNode } from "react";
import { Tile } from "@components/ui";
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from "@heroicons/react/20/solid";
import LedgerSwitchBannerContent from "@components/ledger-switch/banner-content";
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
        <div className="mt-8 xl:mt-8">
          <WithdrawLegacyTokens />
        </div>
      ),
      icon: <ArrowUpTrayIcon className="w-8 h-8 text-content/20" />,
    },
    {
      title: "Step 2: Deposit to your account",
      subtitle:
        "If you have any tokens outside of the OGY dashboard, deposit them to your account-id before you can start to swap them.",
      children: (
        <div className="mt-8 xl:mt-8">
          <Deposit />
        </div>
      ),
      icon: <ArrowDownTrayIcon className="w-8 h-8 text-content/20" />,
    },
    {
      title: "Step 3: Swap tokens",
      subtitle: "Swap the legacy OGY token to the new ledger.",
      children: (
        <div className="mt-8 xl:mt-10">
          <SwapTokens />
        </div>
      ),
      icon: <ArrowPathIcon className="w-8 h-8 text-content/20" />,
    },
  ];

  return (
    <div className={className} {...restProps}>
      <div className="rounded-xl border border-border">
        <div className="bg-ledger-switch bg-cover bg-center bg-surface-2 text-content px-8 pt-8 pb-16 rounded-t-xl">
          <LedgerSwitchBannerContent />
        </div>
        <div className="bg-surface p-8 rounded-b-xl">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {cards.map(({ title, subtitle, icon, children }) => {
              return (
                <div
                  className="flex flex-col p-4 border border-border rounded-xl"
                  key={title}
                >
                  <div className="flex">
                    <Tile className="rounded-xl h-20 w-20 mr-4">
                      {icon as ReactNode}
                    </Tile>
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
