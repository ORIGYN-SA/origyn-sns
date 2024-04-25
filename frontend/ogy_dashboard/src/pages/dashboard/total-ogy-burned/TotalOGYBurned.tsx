import { useEffect, useMemo, useState } from "react";
import Card from "@components/ui/Card";
import BarChart from "@components/charts/bar/Bar";

import useTotalOGYBurned from "./useTotalOGYBurned";
import { ChartData } from "@services/_api/types/charts.types";

type TotalOGYBurned = {
  className?: string;
};

const TotalOGYBurned = ({ className, ...restProps }: TotalOGYBurned) => {
  const [totalBurnedOGY, setTotalBurnedOGY] = useState("0");
  const [totalBurnedOGYTimeSeries, setTotalBurnedOGYTimeSeries] = useState(
    [] as ChartData[]
  );
  const barFill = useMemo(() => "#34d399", []);

  // TODO implement change period (dayly/weekly/monthly...)
  const { data, isSuccess } = useTotalOGYBurned();

  useEffect(() => {
    if (isSuccess) {
      setTotalBurnedOGY(data.totalBurned);
      setTotalBurnedOGYTimeSeries(data.dataPieChart);
    }
  }, [isSuccess, data]);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-content/60">
          Total OGY Burned
        </h2>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Weekly
        </button>
      </div>
      <div className="mt-4 flex items-center text-2xl font-semibold">
        <img src="/ogy_logo.svg" alt="OGY Logo" />
        <span className="ml-2 mr-3">{totalBurnedOGY}</span>
        <span className="text-content/60">OGY</span>
      </div>
      <div className="mt-6 h-96 rounded-lg">
        <BarChart
          data={totalBurnedOGYTimeSeries}
          barFill={barFill}
          legendValue="Total OGY Burned"
        />
      </div>
    </Card>
  );
};

export default TotalOGYBurned;
