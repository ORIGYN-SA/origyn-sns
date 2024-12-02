import { useState } from "react";
import { Card, TooltipInfo, Select } from "@components/ui";
import useGetActiveAccounts from "@hooks/super_stats_v3/useGetActiveAccounts";
import {
  Loader as ChartLoader,
  Error as ChartError,
  Area as ChartArea,
} from "@components/charts";

const SELECT_PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const ChartActiveAccounts = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data, isSuccess, isLoading, isError } = useGetActiveAccounts({
    period: selectedPeriod,
  });

  const handleOnChangePeriod = (period: string) => {
    setSelectedPeriod(period);
  };

  return (
    <Card className={className} {...restProps}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold mr-2">Active Accounts</h2>
        <Select
          options={SELECT_PERIOD_OPTIONS}
          value={selectedPeriod}
          handleOnChange={(value) => handleOnChangePeriod(value as string)}
          className="w-25"
        />
      </div>
      {isLoading && <ChartLoader />}
      {isError && (
        <ChartError>Error while fetching active accounts data.</ChartError>
      )}
      {isSuccess && data && !isLoading && (
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
                <span className="mr-3">{data.total}</span>
              </div>
            </div>
          </div>
          <div className="xl:w-3/4 h-72 rounded-xl">
            <ChartArea data={data.dataChart} fill="#38bdf8" />
          </div>
        </div>
      )}
    </Card>
  );
};

export default ChartActiveAccounts;
