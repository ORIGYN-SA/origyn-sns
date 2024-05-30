import { useEffect, useMemo, useState } from "react";
// import BarChart from "@components/charts/bar/Bar";
import AreaChart from "@components/charts/area/Area";
import { Card, TooltipInfo } from "@components/ui";
import useTotalOGYSupply from "@hooks/metrics/useTotalOGYSupply";
import { ChartData } from "@services/types/charts.types";

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
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-content/60 mr-2">
            Total OGY Supply
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
        <button className="text-sm font-medium rounded-full px-3 py-1">
          Weekly
        </button>
      </div>
      <div className="mt-4 flex items-center text-2xl font-semibold">
        <img src="/ogy_logo.svg" alt="OGY Logo" />
        <span className="ml-2 mr-3">{totalSupplyOGY}</span>
        <span className="text-content/60">OGY</span>
      </div>
      <div className="mt-6 h-72 rounded-xl">
        {/* <BarChart data={totalSupplyOGYTimeSeries} barFill={barFill} /> */}
        <AreaChart data={totalSupplyOGYTimeSeries} fill={barFill} />
      </div>
    </Card>
  );
};

export default TotalOGYSupply;
