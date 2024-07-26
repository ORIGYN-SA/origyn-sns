import { useEffect, useMemo, useState } from "react";
import { Card, TooltipInfo, Select } from "@components/ui";
// import BarChart from "@components/charts/bar/Bar";
import AreaChart from "@components/charts/area/Area";
import useTotalOGYBurned from "@hooks/metrics/useTotalOGYBurned";
import { ChartData } from "@services/types/charts.types";

const SELECT_PERIOD_OPTIONS = [
  // { value: "daily" },
  { value: "weekly" },
  { value: "monthly" },
  { value: "yearly" },
];

const TotalOGYBurned = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const [totalBurnedOGY, setTotalBurnedOGY] = useState("0");
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [totalBurnedOGYTimeSeries, setTotalBurnedOGYTimeSeries] = useState(
    [] as ChartData[]
  );
  const barFill = useMemo(() => "#34d399", []);

  // TODO implement change period (dayly/weekly/monthly...)
  const { data, isSuccess } = useTotalOGYBurned({ period: selectedPeriod });

  const handleOnChangePeriod = (period: string) => {
    setSelectedPeriod(period);
  };

  useEffect(() => {
    if (isSuccess) {
      setTotalBurnedOGY(data.totalBurned);
      setTotalBurnedOGYTimeSeries(data.dataPieChart);
    }
  }, [isSuccess, data]);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-content/60 mr-2">
            Total OGY Burned
          </h2>
          <TooltipInfo id="tooltip-total-ogy-burned">
            <p>
              Total amount of OGY tokens burned. These tokens have been burned
              completely and are no longer available.
            </p>
            <p>
              Tokens can be burned for different reasons for example certificate
              minting fees, network utility fees or network transactions fees.
            </p>
          </TooltipInfo>
        </div>
        <Select
          options={SELECT_PERIOD_OPTIONS}
          value={selectedPeriod}
          handleOnChange={(value) => handleOnChangePeriod(value as string)}
          className="w-25"
        />
        {/* <button className="text-sm font-medium rounded-full px-3 py-1">
          Monthly
        </button> */}
      </div>
      <div className="mt-4 flex items-center text-2xl font-semibold">
        <img src="/ogy_logo.svg" alt="OGY Logo" />
        <span className="ml-2 mr-3">{totalBurnedOGY}</span>
        <span className="text-content/60">OGY</span>
      </div>
      <div className="mt-6 h-72 rounded-xl">
        {/* <BarChart
          data={totalBurnedOGYTimeSeries}
          barFill={barFill}
          legendValue="Total OGY Burned"
        /> */}
        <AreaChart data={totalBurnedOGYTimeSeries} fill={barFill} />
      </div>
    </Card>
  );
};

export default TotalOGYBurned;
