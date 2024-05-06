import { useEffect, useMemo, useState } from "react";
import BarChart from "@components/charts/bar/Bar";
import Card from "@components/ui/Card";
import useTotalOGYSupply from "./useTotalOGYSupply";
import { ChartData } from "@services/_api/types/charts.types";

type TotalOGYSupply = {
  className?: string;
};

const TotalOGYSupply = ({ className, ...restProps }: TotalOGYSupply) => {
  const [totalSupplyOGY, setTotalSupplyOGY] = useState("0");
  const [totalSupplyOGYTimeSeries, setTotalSupplyOGYTimeSeries] = useState(
    [] as ChartData[]
  );
  const barFill = useMemo(() => "#38bdf8", []);

  // TODO implement change period (dayly/weekly/monthly...)
  const { data, isSuccess } = useTotalOGYSupply();

  useEffect(() => {
    if (isSuccess) {
      setTotalSupplyOGY(data.totalSupply);
      setTotalSupplyOGYTimeSeries(data.dataPieChart);
    }
  }, [isSuccess, data]);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-content/60">
          Total OGY Supply
        </h2>
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Weekly
        </button>
      </div>
      <div className="mt-4 flex items-center text-2xl font-semibold">
        <img src="/ogy_logo.svg" alt="OGY Logo" />
        <span className="ml-2 mr-3">{totalSupplyOGY}</span>
        <span className="text-content/60">OGY</span>
      </div>
      <div className="mt-6 h-96 rounded-xl">
        <BarChart data={totalSupplyOGYTimeSeries} barFill={barFill} />
      </div>
    </Card>
  );
};

export default TotalOGYSupply;
