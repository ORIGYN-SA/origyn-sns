import TotalOGYSupply from "@pages/dashboard/total-ogy-supply/TotalOGYSupply";
import TotalOGYBurned from "@pages/dashboard/total-ogy-burned/TotalOGYBurned";
import OGYCirculationState from "@pages/dashboard/ogy-circulation-state/OGYCirculationState";
import OrigynFoundationReserve from "@pages/dashboard/origyn-foundation-reserve/OrigynFoundationReserve";
import GovernanceStakingOverview from "@pages/dashboard/governance-staking-overview/GovernanceStakingOverview";
import OrigynTreasuryAccount from "@pages/dashboard/origyn-treasury-account/OrigynTreasuryAccount";
import { Badge } from "@components/ui";

const Dashboard = () => {
  return (
    <div className="container mx-auto">
      <div className="py-16 px-4 flex flex-col items-center">
        <div className="py-16 flex flex-col items-center">
          <span className="text-sm font-semibold uppercase tracking-wider">
            <Badge
              colorClassName="bg-spacePurple"
              backgoundColorClassName="text-white"
            >
              OGY ANALYTICS
            </Badge>
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold text-center mt-2">
            Explore dashboard
          </h1>
          <p className="mt-3 text-lg text-center px-6">
            Interact trustlessly with web3 dApps, DAOs, NFTs, DeFi and much
            more.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 w-full py-16 gap-8">
          <TotalOGYSupply className="w-full" />
          <TotalOGYBurned className="w-full" />
          <OGYCirculationState className="w-full" />
          <OrigynFoundationReserve className="w-full" />
          <GovernanceStakingOverview className="w-full col-span-1 xl:col-span-2" />
          <OrigynTreasuryAccount className="w-full col-span-1 xl:col-span-2" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
