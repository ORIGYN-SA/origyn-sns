import { ReactNode } from "react";
import AreaChart from "@components/charts/shadcn/AreaChart";
import { Card, TooltipInfo } from "@components/ui";
import CardHeader from "./CardHeader";
import PeriodSelect from "./PeriodSelect";
import Stat from "./Stat";

type PeriodOption = { value: string; label: string };

type AreaStatCardProps = {
  title: string;
  tooltipId: string;
  tooltipTitle?: string;
  tooltipContent: ReactNode;
  value: string | undefined;
  unit?: string;
  iconSrc?: string;
  periodOptions: PeriodOption[];
  period: string;
  onPeriodChange: (value: string) => void;
  chartData: { name: string; value: number }[] | undefined;
  chartColor: string;
  chartLabel: string;
  className?: string;
};

const AreaStatCard = ({
  title,
  tooltipId,
  tooltipTitle,
  tooltipContent,
  value,
  unit = "OGY",
  iconSrc = "/ogy_logo.svg",
  periodOptions,
  period,
  onPeriodChange,
  chartData,
  chartColor,
  chartLabel,
  className,
}: AreaStatCardProps) => (
  <Card className={`flex flex-col ${className ?? ""}`}>
    <CardHeader
      title={title}
      tooltip={
        <TooltipInfo id={tooltipId} title={tooltipTitle}>
          {tooltipContent}
        </TooltipInfo>
      }
      subtitle={<Stat iconSrc={iconSrc} value={value} unit={unit} />}
      right={
        <PeriodSelect
          options={periodOptions}
          value={period}
          onChange={onPeriodChange}
        />
      }
    />
    <div
      data-skel-block
      className="mt-4 flex-1 min-h-72 w-full rounded-xl"
    >
      <AreaChart
        data={chartData}
        color={chartColor}
        label={chartLabel}
        className="h-full w-full"
      />
    </div>
  </Card>
);

export default AreaStatCard;
