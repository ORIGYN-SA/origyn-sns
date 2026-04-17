import { useState } from "react";
import { Card, TooltipInfo, SkeletonOverlay } from "@components/ui";
import { PeriodSelect } from "@components/dashboard";
import useGetActiveAccounts from "@hooks/super_stats_v3/useGetActiveAccounts";
import {
  Error as ChartError,
  Area as ChartArea,
} from "@components/charts";
import { FAKE_AREA_SERIES, FAKE_STAT_VALUE } from "@helpers/skeleton/fakeData";

const SELECT_PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const ChartActiveAccounts = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data, isLoading, isError } = useGetActiveAccounts({
    period: selectedPeriod,
  });

  const handleOnChangePeriod = (period: string) => {
    setSelectedPeriod(period);
  };

  const total = isLoading || !data ? FAKE_STAT_VALUE : data.total;
  const chartData = isLoading || !data ? FAKE_AREA_SERIES : data.dataChart;

  return (
    <Card className={className} {...restProps}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold mr-2">Active Accounts</h2>
        <PeriodSelect
          options={SELECT_PERIOD_OPTIONS}
          value={selectedPeriod}
          onChange={handleOnChangePeriod}
        />
      </div>
      {isError && (
        <ChartError>Error while fetching active accounts data.</ChartError>
      )}
      {!isError && (
        <SkeletonOverlay loading={isLoading}>
          <div className="flex flex-col xl:flex-row mt-4">
            <div className="xl:w-1/4 flex flex-col">
              <div>
                <div className="flex">
                  <span className="text-content/60 font-semibold mr-2">
                    Total Unique Accounts
                  </span>
                  <TooltipInfo id="tooltip-total-accounts">
                    <p>The total number of unique accounts.</p>
                  </TooltipInfo>
                </div>
                <div className="text-2xl font-semibold mt-2">
                  <span className="mr-3">{total}</span>
                </div>
              </div>
              <div className="items-center justify-start mr-6 mt-auto mb-6 hidden md:flex">
                <div
                  className="h-2 w-4 rounded-lg"
                  style={{ backgroundColor: "#38bdf8" }}
                ></div>
                <div className="text-xs text-content/60 font-semibold ml-2 uppercase">
                  Total Active Accounts
                </div>
              </div>
            </div>
            <div
              data-skel-block
              className="xl:w-3/4 h-72 rounded-xl my-6"
            >
              <ChartArea data={chartData} fill="#38bdf8" />
            </div>
            <div className="items- justify-end flex mr-6 md:hidden">
              <div
                className="h-2 w-4 rounded-lg"
                style={{ backgroundColor: "#38bdf8" }}
              ></div>
              <div className="text-xs text-content/60 font-semibold ml-2 uppercase">
                Total Active Accounts
              </div>
            </div>
          </div>
        </SkeletonOverlay>
      )}
    </Card>
  );
};

export default ChartActiveAccounts;
