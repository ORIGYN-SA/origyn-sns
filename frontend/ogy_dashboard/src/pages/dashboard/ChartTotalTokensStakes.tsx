import { useState } from "react";
import { Card, TooltipInfo } from "@components/ui";
import Skeleton from "@components/ui/SkeletonShadcn";
import { PeriodSelect } from "@components/dashboard";
import { Error as ChartError } from "@components/charts";
import AreaChart from "@components/charts/shadcn/AreaChart";
import useTotalTokensStake from "@hooks/metrics/useTotalTokensStakes";

const SELECT_PERIOD_OPTIONS = [
  { value: "7", label: "Weekly" },
  { value: "30", label: "Monthly" },
  { value: "365", label: "Yearly" },
];

const ChartTotalTokensStakes = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const [selectedDays, setSelectedDays] = useState("30");
  const { data, isLoading, isError } = useTotalTokensStake({
    start: Number(selectedDays),
  });

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold mr-2">
            Governance Staking Overview
          </h2>
        </div>
        <PeriodSelect
          options={SELECT_PERIOD_OPTIONS}
          value={selectedDays}
          onChange={setSelectedDays}
        />
      </div>
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-4">
        <div className="col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex">
              <span className="text-content/60 font-semibold mr-2">
                Total Tokens in Stakes
              </span>
              <TooltipInfo id="tooltip-total-tokens-in-stakes">
                <p>Tokens that are locked in stakes.</p>
              </TooltipInfo>
            </div>
            <div className="text-2xl font-semibold mt-2 mb-12 xl:mb-0">
              {isLoading ? (
                <Skeleton className="h-7 w-40" />
              ) : (
                <>
                  <span className="mr-3">{data?.total}</span>
                  <span className="text-content/60">OGY</span>
                </>
              )}
            </div>
          </div>
          <div className="xl:flex items-center mb-6 hidden">
            <div className="h-2 w-4 bg-[#38bdf8] mr-2 rounded-lg"></div>
            <div className="text-xs text-content/60 font-semibold">
              STAKED TOKENS
            </div>
          </div>
        </div>
        <div className="col-span-3 h-72 rounded-xl">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <AreaChart
              data={data?.dataChart}
              color="#38bdf8"
              label="Staked Tokens"
              className="h-full w-full"
            />
          )}
        </div>
        <div className="flex items-center justify-end mt-2 mr-6 xl:hidden">
          <div className="h-2 w-4 bg-[#38bdf8] mr-2 rounded-lg"></div>
          <div className="text-xs text-content/60 font-semibold">
            STAKED TOKENS
          </div>
        </div>
      </div>
      {isError && (
        <ChartError>Error while fetching governance staking data.</ChartError>
      )}
    </Card>
  );
};

export default ChartTotalTokensStakes;
