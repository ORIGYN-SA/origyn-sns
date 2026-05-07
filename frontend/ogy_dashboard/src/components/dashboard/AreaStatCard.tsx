import { ReactNode } from "react";
import AreaChart from "@components/charts/shadcn/AreaChart";
import { Card, TooltipInfo, SkeletonOverlay } from "@components/ui";
import { FAKE_AREA_SERIES } from "@helpers/skeleton/fakeData";
import CardErrorOverlay from "./CardErrorOverlay";
import CardHeader from "./CardHeader";
import ChartEmptyState from "./ChartEmptyState";
import PeriodSelect from "./PeriodSelect";
import Stat from "./Stat";

type PeriodOption = { value: string; label: string };

type AreaStatCardProps = {
  title: string;
  tooltipId?: string;
  tooltipTitle?: string;
  tooltipContent?: ReactNode;
  value: string | undefined;
  unit?: string;
  iconSrc?: string;
  periodOptions: PeriodOption[];
  period: string;
  onPeriodChange: (value: string) => void;
  chartData: { name: string; value: number }[] | undefined;
  chartColor: string;
  chartLabel: string;
  loading?: boolean;
  error?: unknown;
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
  loading = false,
  error,
  className,
}: AreaStatCardProps) => {
  const hasError = !loading && !!error;
  const showSkeleton = loading || hasError;
  const displayChartData =
    showSkeleton && !chartData ? FAKE_AREA_SERIES : chartData;
  const isEmpty = !showSkeleton && (!chartData || chartData.length === 0);
  return (
    <SkeletonOverlay loading={showSkeleton}>
      <Card className={`flex flex-col ${className ?? ""}`}>
        <CardHeader
          title={title}
          tooltip={
            tooltipContent && tooltipId ? (
              <TooltipInfo id={tooltipId} title={tooltipTitle}>
                {tooltipContent}
              </TooltipInfo>
            ) : undefined
          }
          subtitle={
            <Stat
              iconSrc={iconSrc}
              value={value}
              unit={unit}
              loading={showSkeleton}
            />
          }
          right={
            <PeriodSelect
              options={periodOptions}
              value={period}
              onChange={onPeriodChange}
            />
          }
        />
        <div data-skel-block className="mt-4 flex-1 min-h-72 w-full rounded-xl">
          {isEmpty ? (
            <ChartEmptyState title={title} />
          ) : (
            <AreaChart
              data={displayChartData}
              color={chartColor}
              label={chartLabel}
              className="h-full w-full"
            />
          )}
        </div>
        {hasError && <CardErrorOverlay title={title} />}
      </Card>
    </SkeletonOverlay>
  );
};

export default AreaStatCard;
