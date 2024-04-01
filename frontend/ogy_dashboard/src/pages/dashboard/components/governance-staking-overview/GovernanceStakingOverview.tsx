import { useMemo } from "react";
import Card from "@components/cards/Card";
import AreaChart from "@components/charts/area/Area";

type GovernanceStakingOverview = {
  className?: string;
};

const GovernanceStakingOverview = ({
  className,
  ...restProps
}: GovernanceStakingOverview) => {
  const data = useMemo(
    () => [
      {
        name: "27 feb",
        value: 2000,
      },
      {
        name: "27 mar",
        value: 1500,
      },
      {
        name: "27 apr",
        value: 1200,
      },
      {
        name: "27 may",
        value: 1000,
      },
      {
        name: "27 jun",
        value: 850,
      },
      {
        name: "27 jul",
        value: 500,
      },
      {
        name: "27 aug",
        value: 200,
      },
    ],
    []
  );

  const fill = useMemo(() => "#38bdf8", []);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Governance Staking Overview</div>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Weekly
        </button>
      </div>

      <div className="flex flex-col xl:flex-row mt-8">
        <div className="shrink-0 mr-16 mb-8">
          <h2 className="mb-2 text-lg font-semibold text-gray-500">
            Total Token in Stakes
          </h2>
          <div className="flex items-center text-2xl font-semibold">
            <img src="/vite.svg" alt="OGY Logo" />
            <span className="ml-2 mr-3">10 418 169 376,19</span>
            <span className="text-gray-500">OGY</span>
          </div>
        </div>

        <div className="w-full h-80 rounded-lg">
          <AreaChart data={data} fill={fill} />
        </div>
      </div>
    </Card>
  );
};

export default GovernanceStakingOverview;
