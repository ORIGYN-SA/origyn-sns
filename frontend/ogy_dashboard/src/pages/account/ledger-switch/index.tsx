/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { ReactNode } from "react";
import { Tile, ExternalLink } from "@components/ui";
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
      subtitle: (
        <div className="text-content/60">
          If you were previously participating in OGY governance, you need to
          withdraw those tokens before you can swap them.
        </div>
      ),
      children: (
        <div className="">
          <div className="mt-8">
            <WithdrawLegacyTokens />
          </div>
        </div>
      ),
      icon: <ArrowUpTrayIcon className="w-7 h-7 text-content" />,
    },
    {
      title: "Step 2: Deposit to your account",
      subtitle: (
        <div className="text-content/60">
          If you have any tokens outside of the OGY dashboard, deposit them to
          your account-id before you can start to swap them.
        </div>
      ),
      children: (
        <div className="mt-8 xl:mt-8">
          <Deposit />
        </div>
      ),
      icon: <ArrowDownTrayIcon className="w-7 h-7 text-content" />,
    },
    {
      title: "Step 3: Swap tokens",
      subtitle: (
        <div className="text-content/60">
          Swap the legacy OGY token to the new ledger.
        </div>
      ),
      children: (
        <div className="mt-8 xl:mt-10">
          <SwapTokens />
        </div>
      ),
      icon: <ArrowPathIcon className="w-7 h-7 text-content" />,
    },
  ];

  return (
    <div className={className} {...restProps}>
      <div className="rounded-xl border border-border">
        <div className="bg-ledger-switch bg-cover bg-center bg-surface-2 text-content px-8 pt-8 pb-16 rounded-t-xl">
          <LedgerSwitchBannerContent>
            <div className="w-full flex justify-center mt-4">
              <ExternalLink
                className="text-white"
                href="https://origyn.gitbook.io/origyn/how-to/how-to-swap-legacy-ogy-to-sns-ogy"
              >
                How to swap tokens
              </ExternalLink>
            </div>
          </LedgerSwitchBannerContent>
        </div>
        <div className="bg-surface p-8 rounded-b-xl">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {cards.map(({ title, subtitle, icon, children }) => {
              return (
                <div
                  className="flex flex-col p-4 border border-border rounded-xl"
                  key={title}
                >
                  <div className="flex flex-col items-center sm:items-start sm:flex-row">
                    <Tile className="rounded-xl h-12 w-12 sm:h-20 sm:w-20 mb-4 sm:mb-0 sm:mr-4 bg-surface-2">
                      {icon as ReactNode}
                    </Tile>
                    <div className="text-center sm:text-left">
                      <div className="font-semibold">{title}</div>
                      {subtitle as ReactNode}
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
