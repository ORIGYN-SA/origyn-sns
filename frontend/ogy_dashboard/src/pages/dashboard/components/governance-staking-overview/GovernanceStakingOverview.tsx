import AreaChart from "@components/charts/area/Area";
import Card from "@components/cards/Card";

type GovernanceStakingOverview = {
  className?: string;
};

const GovernanceStakingOverview = ({
  className,
  ...restProps
}: GovernanceStakingOverview) => {
  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Governance Staking Overview</div>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Info
        </button>
      </div>

      {/* <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-500">
          Governance Staking Overview
        </h2>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Weekly
        </button>
      </div> */}
      <div className="mt-4 flex items-center text-2xl font-semibold">
        <img src="/vite.svg" alt="OGY Logo" />
        <span className="ml-2 mr-3">10 418 169 376,19</span>
        <span className="text-gray-500">OGY</span>
      </div>
      <div className="mt-6 h-80 rounded-lg">
        <AreaChart />
      </div>
    </Card>
  );
};

export default GovernanceStakingOverview;
