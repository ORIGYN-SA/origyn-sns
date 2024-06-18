import { useMemo } from "react";
import { Card, TooltipInfo } from "@components/ui";
import {
  Loader as ChartLoader,
  Error as ChartError,
  Area as ChartArea,
} from "@components/charts";
import useTotalTokensStake from "@hooks/metrics/useTotalTokensStakes";

const ChartTotalTokensStakes = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const barFill = useMemo(() => "#34d399", []);

  // TODO implement change period (dayly/weekly/monthly...)
  const { data, isLoading, isSuccess, isError } = useTotalTokensStake({
    start: 30,
  });

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold mr-2">Staking Overview</h2>
        </div>
        {isSuccess && (
          <button className="text-sm font-medium rounded-full px-3 py-1">
            Monthly
          </button>
        )}
      </div>
      {isLoading && <ChartLoader />}
      {isSuccess && (
        <div className="mt-4 grid grid-cols-1 xl:grid-cols-4">
          <div className="col-span-1">
            <div className="flex">
              <span className="text-content/60 font-semibold mr-2">
                Total Tokens in Stakes
              </span>
              <TooltipInfo id="tooltip-total-tokens-in-stakes">
                <p>Tokens that are locked in stakes.</p>
              </TooltipInfo>
            </div>
            <div className="text-2xl font-semibold mt-2 mb-12 xl:mb-0">
              <span className="mr-3">{data?.total}</span>
              <span className="text-content/60">OGY</span>
            </div>
          </div>
          <div className="col-span-3 h-72 rounded-xl">
            <ChartArea data={data?.dataChart} fill={barFill} />
          </div>
        </div>
      )}
      {isError && (
        <ChartError>Error while fetching governance staking data.</ChartError>
      )}
    </Card>
  );
};

export default ChartTotalTokensStakes;
