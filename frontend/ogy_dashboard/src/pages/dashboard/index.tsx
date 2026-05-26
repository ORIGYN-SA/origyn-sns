import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWallet } from "@components/auth/useWallet";
import TotalOGYSupply from "@pages/dashboard/total-ogy-supply/TotalOGYSupply";
import TotalOGYBurned from "@pages/dashboard/total-ogy-burned/TotalOGYBurned";
import OGYCirculationState from "@pages/dashboard/ogy-circulation-state/OGYCirculationState";
import OrigynFoundationReserve from "@pages/dashboard/origyn-foundation-reserve/OrigynFoundationReserve";
import OrigynTreasuryAccount from "@pages/dashboard/origyn-treasury-account/OrigynTreasuryAccount";
import OrigynRewardAccount from "@pages/dashboard/origyn-reward-account";
import { Badge, Button } from "@components/ui";
import AuthButton from "@components/auth/Auth";
import LedgerSwitchBanner from "@components/ledger-switch/banner";
import TokenDistributionList from "@pages/dashboard/token-distribution";
import TransactionHistory from "@pages/dashboard/transaction-history";
import { StakingOverviewChart } from "@components/dashboard";
import ChartUsersActivity from "./ChartUsersActivity";
import { PieChartProvider } from "@components/charts/pie/context";

const HERO_BG_MASK =
  "radial-gradient(ellipse at center, black 10%, transparent 65%)";

const HERO_BG_GRADIENTS = `
  radial-gradient(ellipse at 70% 80%, rgba(80,190,143,0.32), transparent 50%),
  radial-gradient(ellipse at 55% 65%, rgba(31,156,212,0.32), transparent 50%),
  radial-gradient(ellipse at 30% 75%, rgba(123,63,160,0.22), transparent 50%)
`;

const LEDGER_SWITCH_CTA_CLASS = "!px-[25px] !py-0 text-[14px] leading-[48px]";

const HeroBackground = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden dark:hidden"
  >
    <div
      className="w-[1238px] aspect-[41/20]"
      style={{
        background: HERO_BG_GRADIENTS,
        maskImage: HERO_BG_MASK,
        WebkitMaskImage: HERO_BG_MASK,
      }}
    />
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const location = useLocation();
  const scrollTarget = (location.state as { scrollTo?: string })?.scrollTo;

  const scrollRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node || !scrollTarget || node.id !== scrollTarget) return;
      setTimeout(() => {
        node.scrollIntoView();
      }, 500);
      window.history.replaceState({}, "");
    },
    [scrollTarget]
  );

  const handleClickAccount = () => {
    navigate("account");
  };

  return (
    <div className="max-w-[1440px] mx-auto">
      <section className="relative isolate overflow-hidden">
        <HeroBackground />

        <div className="flex flex-col items-center pt-8 pb-8 px-6 sm:pt-16 sm:pb-16">
          <div className="flex flex-col items-center gap-2 px-6 py-6 max-w-[528px] sm:px-16 sm:py-8">
            <Badge className="bg-spacePurple !py-0 px-[9px] text-white font-extrabold text-[10px] leading-[22px] tracking-[2px] uppercase">
              OGY ANALYTICS
            </Badge>
            <h1 className="font-extrabold text-[40px] leading-[44px] sm:text-[64px] sm:leading-[60px] tracking-[-0.05em] text-center text-content">
              Explore dashboard
            </h1>
            <p className="font-light text-[16px] sm:text-[22px] leading-snug sm:leading-none text-center text-muted">
              Interact trustlessly with web3 dApps, DAOs, NFTs, DeFi and much
              more.
            </p>
          </div>

        </div>
      </section>

      <div className="flex flex-col items-center pb-16 px-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 w-full gap-x-6 gap-y-16 pb-16">
          <section className="w-full h-full" id="total-ogy-supply">
            <TotalOGYSupply className="h-full" />
          </section>
          <section className="w-full h-full" id="total-ogy-burned">
            <TotalOGYBurned className="h-full" />
          </section>
          <section className="w-full pt-8 -mt-8" id="ogy-circulation-state">
            <PieChartProvider>
              <OGYCirculationState />
            </PieChartProvider>
          </section>
          <section className="w-full pt-8 -mt-8" id="ogy-foundation-reserve">
            <PieChartProvider>
              <OrigynFoundationReserve />
            </PieChartProvider>
          </section>
          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="governance-tokens-stakes"
          >
            <StakingOverviewChart
              title="Governance Staking Overview"
              chartColor="#38bdf8"
            />
          </section>

          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="ogy-treasury-account"
          >
            <OrigynTreasuryAccount />
          </section>

          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="ogy-reward-account"
          >
            <OrigynRewardAccount />
          </section>

          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="transaction-history"
          >
            <TransactionHistory />
          </section>
          <section
            ref={scrollRef}
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="ogy-token-distribution"
          >
            <TokenDistributionList />
          </section>
          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="users-activity"
          >
            <ChartUsersActivity />
          </section>
        </div>

        <LedgerSwitchBanner className="w-full">
          <div className="flex justify-center mt-8">
            {!isConnected && (
              <AuthButton
                label="Login to swap tokens"
                className={LEDGER_SWITCH_CTA_CLASS}
              />
            )}
            {isConnected && (
              <Button className={LEDGER_SWITCH_CTA_CLASS} onClick={handleClickAccount}>
                My account
              </Button>
            )}
          </div>
        </LedgerSwitchBanner>
      </div>
    </div>
  );
};

export default Dashboard;
