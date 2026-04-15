import { ReactNode } from "react";
import { Card, TooltipInfo } from "@components/ui";
import Skeleton from "@components/ui/SkeletonShadcn";
import { Error as ChartError } from "@components/charts";
import AreaChart from "@components/charts/shadcn/AreaChart";
import PeriodSelect from "./PeriodSelect";
import Stat from "./Stat";

type StatItem = {
  id: string;
  label: string;
  tooltipContent: ReactNode;
  value: string | undefined;
  unit?: string;
};

type PeriodOption = { value: string; label: string };

type ChartStatsCardProps = {
  title: string;
  periodOptions: PeriodOption[];
  period: string;
  onPeriodChange: (value: string) => void;
  stats: StatItem[];
  chart: {
    data: { name: string; value: number }[] | undefined;
    color: string;
    label: string;
  };
  legendLabel: string;
  loading: boolean;
  isError?: boolean;
  errorMessage?: string;
  className?: string;
};

const ChartStatsCard = ({
  title,
  periodOptions,
  period,
  onPeriodChange,
  stats,
  chart,
  legendLabel,
  loading,
  isError,
  errorMessage,
  className,
}: ChartStatsCardProps) => (
  <Card className={className}>
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold mr-2">{title}</h2>
      <PeriodSelect
        options={periodOptions}
        value={period}
        onChange={onPeriodChange}
      />
    </div>
    <div className="mt-4 grid grid-cols-1 xl:grid-cols-4">
      <div className="col-span-1 flex flex-col justify-between">
        <div>
          {stats.map((stat, index) => (
            <div key={stat.id} className={index === 0 ? "" : "mt-6"}>
              <div className="flex">
                <span className="text-content/60 font-semibold mr-2">
                  {stat.label}
                </span>
                <TooltipInfo id={`tooltip-${stat.id}`}>
                  {stat.tooltipContent}
                </TooltipInfo>
              </div>
              <div
                className={`mt-2 ${
                  index === stats.length - 1 ? "mb-12 xl:mb-0" : "mb-4 xl:mb-0"
                }`}
              >
                <Stat value={stat.value} unit={stat.unit} loading={loading} />
              </div>
            </div>
          ))}
        </div>
        <div className="xl:flex items-center mb-6 hidden">
          <div
            className="h-1 w-[13px] rounded-[2px]"
            style={{ backgroundColor: chart.color }}
          />
          <div className="text-xs text-content/60 font-semibold ml-2">
            {legendLabel}
          </div>
        </div>
      </div>
      <div className="col-span-3 h-72 rounded-xl">
        {loading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <AreaChart
            data={chart.data}
            color={chart.color}
            label={chart.label}
            className="h-full w-full"
          />
        )}
      </div>
      <div className="flex items-center justify-end mt-2 mr-6 xl:hidden">
        <div
          className="h-2 w-4 rounded-lg"
          style={{ backgroundColor: chart.color }}
        />
        <div className="text-xs text-content/60 font-semibold ml-2">
          {legendLabel}
        </div>
      </div>
    </div>
    {isError && <ChartError>{errorMessage}</ChartError>}
  </Card>
);

export default ChartStatsCard;
