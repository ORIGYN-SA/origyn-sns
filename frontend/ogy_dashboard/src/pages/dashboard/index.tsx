import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useWallet } from "@amerej/artemis-react";
import TotalOGYSupply from "@pages/dashboard/total-ogy-supply/TotalOGYSupply";
import TotalOGYBurned from "@pages/dashboard/total-ogy-burned/TotalOGYBurned";
import OGYCirculationState from "@pages/dashboard/ogy-circulation-state/OGYCirculationState";
import OrigynFoundationReserve from "@pages/dashboard/origyn-foundation-reserve/OrigynFoundationReserve";
import OrigynTreasuryAccount from "@pages/dashboard/origyn-treasury-account/OrigynTreasuryAccount";
import OrigynRewardAccount from "@pages/dashboard/origyn-reward-account";
import { Badge, Button } from "@components/ui";
import AuthButton from "@components/auth/Auth";
import LedgerSwitchBannerContent from "@components/ledger-switch/banner-content";
import TokenDistributionList from "@pages/dashboard/token-distribution";
import TransactionHistory from "@pages/dashboard/transaction-history";
import { StakingOverviewChart } from "@components/dashboard";
import ChartUsersActivity from "./ChartUsersActivity";
import { PieChartProvider } from "@components/charts/pie/context";
// import ChartActiveAccounts from "./ChartActiveAccounts";
// import TopTransfersAndBurns from "./top-transfers-and-burns/TopTransfersAndBurns";
// import OGYActivitiesMetrics from "./OGYActivitiesMetrics";
// import ChartTransactionStats from "./ChartTransactionStats";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const location = useLocation();
  const scrollTarget = (location.state as { scrollTo?: string })?.scrollTo;

  const scrollRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node || !scrollTarget || node.id !== scrollTarget) return;
      setTimeout(() => {
        node.scrollIntoView({ behavior: "smooth" });
      }, 500);
      window.history.replaceState({}, "");
    },
    [scrollTarget]
  );

  const handleClickAccount = () => {
    navigate("account");
  };

  return (
    <div className="max-w-[1440px] mx-auto py-16 px-6">
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 px-16 py-8 max-w-[528px]">
          <Badge className="bg-spacePurple !py-0 px-[9px] text-white font-extrabold text-[10px] leading-[22px] tracking-[2px] uppercase">
            OGY ANALYTICS
          </Badge>
          <h1 className="font-extrabold text-[64px] leading-[60px] tracking-[-0.05em] text-center text-content">
            Explore dashboard
          </h1>
          <p className="font-light text-[22px] leading-none text-center text-muted">
            Interact trustlessly with web3 dApps, DAOs, NFTs, DeFi and much more.
          </p>
        </div>

        <div className="bg-ledger-switch bg-cover bg-center bg-black text-content p-12 rounded-[40px] shadow-[0px_10px_50px_0px_#06274926] my-16 w-full">
          <LedgerSwitchBannerContent>
            <div className="flex justify-center mt-8">
              {!isConnected && <AuthButton label="Login to swap tokens" />}
              {isConnected && (
                <Button onClick={handleClickAccount}>My account</Button>
              )}
            </div>
          </LedgerSwitchBannerContent>
        </div>

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
          {/* <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="ogy-activities-metrics"
          >
            <OGYActivitiesMetrics />
          </section> */}
          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="governance-tokens-stakes"
          >
            <StakingOverviewChart
              title="Governance Staking Overview"
              chartColor="#38bdf8"
            />
          </section>
          {/* <GovernanceStakingOverview className="w-full col-span-1 xl:col-span-2" /> */}

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

          {/* <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="top-transfers"
          >
            <TopTransfersAndBurns
              type="transfers"
              title="Top 5 Transfers"
              limit={5}
            />
          </section> */}
          {/* <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="top-burns"
          >
            <TopTransfersAndBurns type="burns" title="Top 5 Burns" limit={5} />
          </section> */}
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
          {/* <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="transaction-stats"
          >
            <ChartTransactionStats />
          </section> */}
          {/* <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="active-accounts"
          >
            <ChartActiveAccounts />
          </section> */}
          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="users-activity"
          >
            <ChartUsersActivity />
          </section>
          {/* <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="ogy-users-map"
          >
            <UsersMap />
          </section> */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
