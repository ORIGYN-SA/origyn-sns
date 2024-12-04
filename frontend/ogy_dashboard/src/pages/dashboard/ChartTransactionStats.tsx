import { useState } from "react";
import { Card, Select } from "@components/ui";
import useGetTransactionStats from "@hooks/transactions/useGetTransactionStats";
import {
  Loader as ChartLoader,
  Error as ChartError,
  Area as ChartArea,
} from "@components/charts";

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
  const { data, isSuccess, isLoading, isError } = useGetTransactionStats({
    period: selectedPeriod,
  });

  const handleOnChangePeriod = (period: string) => {
    setSelectedPeriod(period);
  };

  return (
    <Card className={className} {...restProps}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold mr-2">Transaction Statistics</h2>
        <Select
          options={SELECT_PERIOD_OPTIONS}
          value={selectedPeriod}
          handleOnChange={(value) => handleOnChangePeriod(value as string)}
          className="w-25"
        />
      </div>
      {isLoading && <ChartLoader />}
      {isError && !isLoading && !data && (
        <ChartError>Error while fetching transaction data.</ChartError>
      )}
      {isSuccess && data && !isLoading && (
        <div className="flex flex-col xl:flex-row mt-4">
          <div className="xl:w-1/4 flex flex-col">
            <div>
              <div className="flex">
                <span className="text-content/60 font-semibold mr-2">
                  Total Transactions
                </span>
              </div>
              <div className="text-2xl font-semibold mt-2">
                <span className="mr-3">{data.total}</span>
              </div>
            </div>
          </div>
          <div className="xl:w-3/4 h-72 rounded-xl">
            <ChartArea data={data.dataChart} fill="#645eff" />
          </div>
        </div>
      )}
    </Card>
  );
};

export default ChartTransactionStats;
