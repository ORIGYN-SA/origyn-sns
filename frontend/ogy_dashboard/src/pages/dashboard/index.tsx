import { useNavigate } from "react-router-dom";
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
import ChartTotalTokensStakes from "./ChartTotalTokensStakes";
import ChartUsersActivity from "./ChartUsersActivity";
// import ChartActiveAccounts from "./ChartActiveAccounts";
// import UsersMap from "./users-map/UsersMap";
import { PieChartProvider } from "@components/charts/pie/context";
import Chart from "./top-transfers-and-burns/Chart";
import ChartTransactionStats from "./ChartTransactionStats";
import OGYActivitiesMetrics from "./OGYActivitiesMetrics";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  const handleClickAccount = () => {
    navigate("account");
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center">
          <Badge className="bg-spacePurple px-4">
            <div className="text-white tracking-widest text-xs font-semibold uppercase">
              OGY ANALYTICS
            </div>
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-bold text-center mt-4">
            Explore dashboard
          </h1>
          <p className="mt-3 text-lg text-center px-6">
            Interact trustlessly with web3 dApps, DAOs, NFTs, DeFi and much
            more.
          </p>
        </div>

        <div className="bg-ledger-switch bg-cover bg-center bg-surface-2 text-content px-8 pt-8 pb-16 rounded-xl my-16 w-full">
          <LedgerSwitchBannerContent>
            <div className="flex justify-center mt-8">
              {!isConnected && <AuthButton />}
              {isConnected && (
                <Button onClick={handleClickAccount}>My account</Button>
              )}
            </div>
          </LedgerSwitchBannerContent>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 w-full gap-8">
          <section className="w-full" id="total-ogy-supply">
            <TotalOGYSupply />
          </section>
          <section className="w-full" id="total-ogy-burned">
            <TotalOGYBurned />
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
            id="ogy-activities-metrics">
            <OGYActivitiesMetrics />
          </section>
          {/* <GovernanceStakingOverview className="w-full col-span-1 xl:col-span-2" /> */}
          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="top-transfers">
            <Chart type="transfers" title="Top 5 Transfers" limit={5} />
          </section>
          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="top-burns">
            <Chart type="burns" title="Top 5 Burns" limit={5} />
          </section>
          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="governance-tokens-stakes">
            <ChartTotalTokensStakes />
          </section>
          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="ogy-treasury-account">
            <ChartTransactionStats />
          </section>
          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="ogy-treasury-account">
            <OrigynTreasuryAccount />
          </section>
          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="ogy-reward-account">
            <OrigynRewardAccount />
          </section>
          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="ogy-token-distribution">
            <TokenDistributionList />
          </section>
          <section
            className="w-full col-span-1 xl:col-span-2 pt-8 -mt-8"
            id="users-activity">
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
