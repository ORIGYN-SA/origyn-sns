import { useState } from "react";
import { Card, SkeletonOverlay } from "@components/ui";
import { PeriodSelect } from "@components/dashboard";
import useGetTransactionStats from "@hooks/transactions/useGetTransactionStats";
import {
  Error as ChartError,
  Area as ChartArea,
} from "@components/charts";
import { FAKE_AREA_SERIES, FAKE_STAT_VALUE } from "@helpers/skeleton/fakeData";

const SELECT_PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const ChartTransactionStats = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const { data, isLoading, isError } = useGetTransactionStats({
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
        <h2 className="text-lg font-semibold mr-2">Transaction Statistics</h2>
        <PeriodSelect
          options={SELECT_PERIOD_OPTIONS}
          value={selectedPeriod}
          onChange={handleOnChangePeriod}
        />
      </div>
      {isError && !isLoading && !data && (
        <ChartError>Error while fetching transaction data.</ChartError>
      )}
      {!(isError && !isLoading && !data) && (
        <SkeletonOverlay loading={isLoading}>
          <div className="flex flex-col xl:flex-row mt-4">
            <div className="xl:w-1/4 flex flex-col">
              <div>
                <div className="flex">
                  <span className="text-content/60 font-semibold mr-2">
                    Total Transactions
                  </span>
                </div>
                <div className="text-2xl font-semibold mt-2">
                  <span className="mr-3">{total}</span>
                </div>
              </div>
              <div className="items-center justify-start mr-6 mt-auto mb-6 hidden md:flex">
                <div
                  className="h-2 w-4 rounded-lg"
                  style={{ backgroundColor: "#645eff" }}
                ></div>
                <div className="text-xs text-content/60 font-semibold ml-2 uppercase">
                  Total Transactions
                </div>
              </div>
            </div>
            <div
              data-skel-block
              className="xl:w-3/4 h-72 rounded-xl my-6"
            >
              <ChartArea data={chartData} fill="#645eff" />
            </div>
            <div className="items- justify-end flex mr-6 md:hidden">
              <div
                className="h-2 w-4 rounded-lg"
                style={{ backgroundColor: "#645eff" }}
              ></div>
              <div className="text-xs text-content/60 font-semibold ml-2 uppercase">
                Total Transactions
              </div>
            </div>
          </div>
        </SkeletonOverlay>
      )}
    </Card>
  );
};

export default ChartTransactionStats;
