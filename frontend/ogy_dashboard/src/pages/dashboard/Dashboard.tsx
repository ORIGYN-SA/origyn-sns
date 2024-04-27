import useConnect from "@helpers/useConnect";
import TotalOGYSupply from "@pages/dashboard/total-ogy-supply/TotalOGYSupply";
import TotalOGYBurned from "@pages/dashboard/total-ogy-burned/TotalOGYBurned";
import OGYCirculationState from "@pages/dashboard/ogy-circulation-state/OGYCirculationState";
import OrigynFoundationReserve from "@pages/dashboard/origyn-foundation-reserve/OrigynFoundationReserve";
import GovernanceStakingOverview from "@pages/dashboard/governance-staking-overview/GovernanceStakingOverview";
import OrigynTreasuryAccount from "@pages/dashboard/origyn-treasury-account/OrigynTreasuryAccount";
import { Badge } from "@components/ui";
import AuthButton from "@components/auth/Auth";
import LedgerSwitchBannerContent from "@components/ledger-switch/banner-content";

const Dashboard = () => {
  const { isConnected, isInitializing } = useConnect();
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center">
          <Badge className="bg-spacePurple">
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

        <div className="bg-ledger-switch bg-cover bg-center bg-surface-2 text-content px-8 pt-8 pb-16 rounded-xl my-16">
          <LedgerSwitchBannerContent>
            {!isConnected && !isInitializing && (
              <div className="flex justify-center mt-8">
                {/* <Button>Login to swap tokens</Button> */}
                <AuthButton />
              </div>
            )}
          </LedgerSwitchBannerContent>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 w-full gap-8">
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
