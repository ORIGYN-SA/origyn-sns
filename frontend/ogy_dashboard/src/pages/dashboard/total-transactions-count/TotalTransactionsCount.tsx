import { Card, Select, TooltipInfo } from "@components/ui";
import useFetchCountTransactions from "@hooks/transactions/useFetchCountTransactions";
import { ChartData } from "@services/types/charts.types";
import { useEffect, useMemo, useState } from "react";
import AreaChart from "@components/charts/area/Area";

const TotalTransactionsCount = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const [totalOGYTransactions, setTotalOgyTransactions] = useState<ChartData[]>(
    []
  );
  const [selectedPeriod, setSelectedPeriod] = useState<"daily" | "monthly">(
    "daily"
  );

  const SELECT_PERIOD_OPTIONS = [{ value: "daily" }, { value: "monthly" }];

  const handleOnChangePeriod = (period: "daily" | "monthly") => {
    setSelectedPeriod(period);
  };

  const { data, isSuccess } = useFetchCountTransactions(selectedPeriod);

  useEffect(() => {
    if (isSuccess && data.length > 0 && data !== totalOGYTransactions) {
      setTotalOgyTransactions(data);
    }
  }, [isSuccess, data, totalOGYTransactions]);

  const barFill = useMemo(() => "#38bdf8", []);

  console.log(data);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-content/60 mr-2">
            Total Transactions Count
          </h2>
          <TooltipInfo id="tooltip-total-ogy-supply">
            <p>
              Total amount of OGY tokens available. This includes the
              circulating supply and the supply under control of the ORIGYN
              Foundation.
            </p>
            <p>
              As of 18th September, ORIGYN switched to fully deflationary model
              which means no more new minted tokens.
            </p>
          </TooltipInfo>
        </div>
        <Select
          options={SELECT_PERIOD_OPTIONS}
          value={selectedPeriod}
          handleOnChange={(value) =>
            handleOnChangePeriod(value as "daily" | "monthly")
          }
          className="w-25"
        />
      </div>
      <div className="mt-6 h-72 rounded-xl">
        <AreaChart data={totalOGYTransactions} fill={barFill} />
      </div>
    </Card>
  );
};

export default TotalTransactionsCount;
