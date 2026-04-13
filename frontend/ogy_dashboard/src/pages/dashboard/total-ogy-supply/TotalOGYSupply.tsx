import { useState } from "react";
import AreaChart from "@components/charts/area/Area";
import { Card, TooltipInfo } from "@components/ui";
import { CardHeader, PeriodSelect, Stat } from "@components/dashboard";
import useTotalOGYSupply from "@hooks/metrics/useTotalOGYSupply";

const SELECT_PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const CHART_FILL = "#38bdf8";

const TotalOGYSupply = ({ className }: { className?: string }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data } = useTotalOGYSupply({ period: selectedPeriod });

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader
        title="Total OGY Supply"
        tooltip={
          <TooltipInfo
            id="tooltip-total-ogy-supply"
            title="Total amount of OGY tokens available."
          >
            <p>
              This includes the circulating supply and the supply under
              control of the ORIGYN Foundation.
            </p>
            <p>
              As of 18th September, ORIGYN switched to fully deflationary
              model which means no more new minted tokens.
            </p>
          </TooltipInfo>
        }
        subtitle={
          <Stat iconSrc="/ogy_logo.svg" value={data.totalSupply} unit="OGY" />
        }
        right={
          <PeriodSelect
            options={SELECT_PERIOD_OPTIONS}
            value={selectedPeriod}
            onChange={setSelectedPeriod}
          />
        }
      />
      <div className="mt-4 flex-1 min-h-72 w-full rounded-xl">
        <AreaChart data={data.dataPieChart} fill={CHART_FILL} />
      </div>
    </Card>
  );
};

export default TotalOGYSupply;
