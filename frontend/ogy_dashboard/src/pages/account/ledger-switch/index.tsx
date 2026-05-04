import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { ReactNode, FC } from "react";
import { Tile, ExternalLink } from "@components/ui";
import LedgerSwitchBanner from "@components/ledger-switch/banner";
import WithdrawLegacyTokens from "./withdraw-legacy-tokens";
import Deposit from "./deposit";
import SwapTokens from "./swap-tokens";

interface LedgerSwitchProps {
  className?: string;
}

const WithdrawIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g opacity="0.7">
      <path
        d="M13.98 9.75016L17.82 5.91016L21.66 9.75016"
        stroke="#69737C"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.8198 21.2706V6.01562"
        stroke="#69737C"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 18C6 24.63 10.5 30 18 30C25.5 30 30 24.63 30 18"
        stroke="#69737C"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

const DepositIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g opacity="0.7">
      <path
        d="M13.98 17.5195L17.82 21.3595L21.66 17.5195"
        stroke="#69737C"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17.8198 6V21.255"
        stroke="#69737C"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30 18.2695C30 24.8995 25.5 30.2695 18 30.2695C10.5 30.2695 6 24.8995 6 18.2695"
        stroke="#69737C"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

const SwapIcon = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g opacity="0.7">
      <path
        d="M33 18C33 26.28 26.28 33 18 33C9.72 33 4.665 24.66 4.665 24.66M4.665 24.66H11.445M4.665 24.66V32.16M3 18C3 9.72 9.66 3 18 3C28.005 3 33 11.34 33 11.34M33 11.34V3.84M33 11.34H26.34"
        stroke="#69737C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

const LedgerSwitch: FC<LedgerSwitchProps> = ({ className }) => {
  const cards = [
    {
      title: "Step 1: Withdraw from old governance",
      subtitle: (
        <div className="mt-2 text-sm leading-6 text-muted">
          If you were previously participating in OGY governance, you need to
          withdraw those tokens before you can swap them.
        </div>
      ),
      children: <WithdrawLegacyTokens />,
      icon: <WithdrawIcon />,
    },
    {
      title: "Step 2: Deposit to your account",
      subtitle: (
        <div className="mt-2 text-sm leading-6 text-muted">
          If you have any tokens outside of the OGY dashboard, deposit them to
          your account-id before you can start to swap them.
        </div>
      ),
      children: <Deposit />,
      icon: <DepositIcon />,
    },
    {
      title: "Step 3: Swap tokens",
      subtitle: (
        <div className="mt-2 text-sm leading-6 text-muted">
          Swap the legacy OGY token to the new ledger.
        </div>
      ),
      children: <SwapTokens />,
      icon: <SwapIcon />,
    },
  ];

  return (
    <div className={className}>
      <div>
        <LedgerSwitchBanner className="!rounded-b-none !shadow-none">
          <div className="w-full flex justify-center mt-8">
            <ExternalLink
              className="rounded-full border border-white/25 bg-white/15 px-5 py-2.5 text-[14px] leading-none !text-white backdrop-blur-sm transition-colors hover:bg-white/20 hover:!font-normal"
              href="https://origyn.gitbook.io/origyn/how-to/how-to-swap-legacy-ogy-to-sns-ogy"
            >
              How to swap tokens
            </ExternalLink>
          </div>
        </LedgerSwitchBanner>

        <div className="rounded-b-[40px] border-x border-b border-border-strong bg-white transform-gpu">
          <Disclosure>
            {({ open }) => (
              <>
                <Disclosure.Button className="group flex w-full items-center justify-between gap-4 border-t border-border-strong px-5 py-4 text-left sm:px-6">
                  <span className="text-[16px] font-medium leading-tight text-content sm:text-[17px]">
                    Still have old OGY tokens? Swap now!
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-strong bg-white text-muted transition-colors group-hover:border-content group-hover:text-content">
                    <ChevronDownIcon
                      className={`h-5 w-5 ${open ? "rotate-180" : ""}`}
                    />
                  </span>
                </Disclosure.Button>
                <Disclosure.Panel>
                  <div className="border-t border-border-strong px-5 py-5 sm:px-6">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                      {cards.map(({ title, subtitle, icon, children }) => (
                        <div
                          className="flex h-full flex-col rounded-[20px] border border-border-strong bg-white p-4"
                          key={title}
                        >
                          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                            <Tile className="mb-0 h-[72px] w-[72px] shrink-0 rounded-[16px] bg-[#F1F6F9] text-muted">
                              {icon as ReactNode}
                            </Tile>
                            <div className="min-w-0 text-center sm:text-left">
                              <div className="text-[15px] font-medium leading-tight text-content">
                                {title}
                              </div>
                              {subtitle as ReactNode}
                            </div>
                          </div>
                          <div className="mt-auto pt-5">
                            {children as ReactNode}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </div>
      </div>
    </div>
  );
};

export default LedgerSwitch;
