import { useMemo } from "react";
import {
  Loader as ChartLoader,
  Error as ChartError,
  Area as ChartArea,
} from "@components/charts";
import { Card, TooltipInfo } from "@components/ui";
import useAccountBalanceHistory from "@hooks/metrics/useAccountBalanceHistory";

type BalanceHistoryProps = {
  className?: string;
  account: string;
};

const BalanceHistory = ({
  className,
  account,
  ...restProps
}: BalanceHistoryProps) => {
  const barFill = useMemo(() => "#38bdf8", []);
  const { data, isSuccess, isLoading, isError } = useAccountBalanceHistory({
    account,
  });

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold mr-2">Balance History</h2>
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
          <div className="col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex">
                <span className="text-content/60 font-semibold mr-2">
                  Current balance
                </span>
                <TooltipInfo id="tooltip-total-tokens-in-stakes">
                  <p>Current account balance.</p>
                </TooltipInfo>
              </div>
              <div className="text-2xl font-semibold mt-2 mb-12 xl:mb-0">
                <span className="mr-3">{data?.total}</span>
                <span className="text-content/60">OGY</span>
              </div>
            </div>
            <div className="xl:flex items-center mb-6 hidden">
              <div className="h-2 w-4 bg-[#38bdf8] mr-2 rounded-lg"></div>
              <div className="text-xs text-content/60 font-semibold">
                OGY Balance
              </div>
            </div>
          </div>
          <div className="col-span-3 h-72 rounded-xl">
            <ChartArea data={data?.dataChart} fill={barFill} />
          </div>
          <div className="flex items-center justify-end mt-2 mr-6 xl:hidden">
            <div className="h-2 w-4 bg-[#38bdf8] mr-2 rounded-lg"></div>
            <div className="text-xs text-content/60 font-semibold">
              OGY Balance
            </div>
          </div>
        </div>
      )}
      {isError && (
        <ChartError>Error while fetching account balance data.</ChartError>
      )}
    </Card>
  );
};

export default BalanceHistory;
