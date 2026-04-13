import { useState } from "react";
import AreaChart from "@components/charts/area/Area";
import { Card, TooltipInfo } from "@components/ui";
import { CardHeader, PeriodSelect, Stat } from "@components/dashboard";
import useTotalOGYBurned from "@hooks/metrics/useTotalOGYBurned";

const SELECT_PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const CHART_FILL = "#34d399";

const TotalOGYBurned = ({ className }: { className?: string }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data } = useTotalOGYBurned({ period: selectedPeriod });

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader
        title="Total OGY Burned"
        tooltip={
          <TooltipInfo
            id="tooltip-total-ogy-burned"
            title="Total amount of OGY tokens burned."
          >
            <p>
              These tokens have been burned completely and are no longer
              available.
            </p>
            <p>
              Tokens can be burned for different reasons for example
              certificate minting fees, network utility fees or network
              transactions fees.
            </p>
          </TooltipInfo>
        }
        subtitle={
          <Stat iconSrc="/ogy_logo.svg" value={data.totalBurned} unit="OGY" />
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

export default TotalOGYBurned;
