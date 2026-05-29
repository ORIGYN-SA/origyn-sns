import { type ReactNode } from "react";
import { Card, TooltipInfo, SkeletonOverlay } from "@components/ui";
import AreaChart from "@components/charts/shadcn/AreaChart";
import { FAKE_AREA_SERIES } from "@helpers/skeleton/fakeData";
import { useLocale } from "@i18n/LocaleContext";
import CardErrorOverlay from "./CardErrorOverlay";
import ChartEmptyState from "./ChartEmptyState";
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
  loading?: boolean;
  isError?: boolean;
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
  loading = false,
  isError = false,
  className,
}: ChartStatsCardProps) => {
  const { dir } = useLocale();
  const hasError = !loading && isError;
  const showSkeleton = loading || hasError;
  const displayChartData =
    showSkeleton && !chart.data ? FAKE_AREA_SERIES : chart.data;
  const isEmpty = !showSkeleton && (!chart.data || chart.data.length === 0);
  return (
    <SkeletonOverlay loading={showSkeleton}>
      <Card className={className}>
        <div
          data-skel-static
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <h2 className="text-content text-[22px] font-semibold leading-tight me-2">
            {title}
          </h2>
          <PeriodSelect
            options={periodOptions}
            value={period}
            onChange={onPeriodChange}
          />
        </div>

        <div
          dir="ltr"
          className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,390px)] xl:items-start"
        >
          <div className="order-2 xl:order-1">
            <div data-skel-block className="h-72 rounded-xl xl:h-[360px]">
              {isEmpty ? (
                <ChartEmptyState title={title} />
              ) : (
                <AreaChart
                  data={displayChartData}
                  color={chart.color}
                  label={chart.label}
                  className="h-full w-full"
                />
              )}
            </div>
            <div
              dir={dir}
              className="mt-3 flex items-center justify-end gap-2 pe-2"
            >
              <div
                className="h-1 w-4 rounded-full"
                style={{ backgroundColor: chart.color }}
              />
              <div className="text-xs text-content/60 font-semibold">
                {legendLabel}
              </div>
            </div>
          </div>

          <div
            dir={dir}
            className="order-1 grid gap-3 sm:grid-cols-2 xl:order-2 xl:grid-cols-1"
          >
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="rounded-xl border border-border bg-surface-2/40 p-4"
              >
                <div
                  data-skel-static
                  className="flex items-start gap-2 text-content/60"
                >
                  <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-start">
                    {stat.label}
                  </span>
                  <TooltipInfo id={`tooltip-${stat.id}`}>
                    {stat.tooltipContent}
                  </TooltipInfo>
                </div>
                <div className="mt-3">
                  <Stat
                    value={stat.value}
                    unit={stat.unit}
                    loading={showSkeleton}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        {hasError && <CardErrorOverlay title={title} />}
      </Card>
    </SkeletonOverlay>
  );
};

export default ChartStatsCard;
