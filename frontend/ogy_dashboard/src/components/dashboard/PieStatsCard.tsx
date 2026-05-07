import { ReactNode } from "react";
import { Card, TooltipInfo, SkeletonOverlay } from "@components/ui";
import PieChart, { PieChartData } from "@components/charts/pie/Pie";
import { usePieChart } from "@components/charts/pie/context";
import { FAKE_PIE_SERIES, FAKE_STAT_VALUE } from "@helpers/skeleton/fakeData";
import CardErrorOverlay from "./CardErrorOverlay";
import ChartEmptyState from "./ChartEmptyState";
import Stat from "./Stat";
import StatCard from "./StatCard";

type SegmentInfo = {
  id: string;
  name: string;
  value: ReactNode;
};

type PieStatsCardProps = {
  title: ReactNode;
  titleTooltip?: ReactNode;
  data: PieChartData[] | undefined;
  colors: string[];
  infos: SegmentInfo[];
  totalLabel: ReactNode;
  totalValue: string | undefined;
  loading?: boolean;
  isError?: boolean;
  className?: string;
  layout?: "vertical" | "horizontal";
};

const PieStatsCard = ({
  title,
  titleTooltip,
  data,
  colors,
  infos,
  totalLabel,
  totalValue,
  loading = false,
  isError = false,
  className,
  layout = "vertical",
}: PieStatsCardProps) => {
  const { activeIndex, setActiveIndex } = usePieChart();
  const hasError = !loading && isError;
  const showSkeleton = loading || hasError;
  const displayData =
    showSkeleton && !data ? FAKE_PIE_SERIES.slice(0, infos.length) : data;
  const displayTotal =
    showSkeleton && totalValue == null ? FAKE_STAT_VALUE : totalValue;
  const hasData = !!displayData && displayData.length > 0;
  const isEmpty =
    !showSkeleton &&
    (!data || data.length === 0 || data.every((d) => d.value === 0));

  const chartBlock = (
    <div data-skel-block className="mt-6 h-72 rounded-xl">
      {hasData ? <PieChart data={displayData} colors={colors} /> : null}
    </div>
  );

  const totalBlock = (
    <div className="flex flex-col items-center gap-4 my-4">
      <h2 className="font-semibold text-[16px] leading-none text-muted">
        {totalLabel}
      </h2>
      <Stat
        iconSrc="/ogy_logo.svg"
        value={displayTotal}
        unit="OGY"
        loading={showSkeleton}
      />
    </div>
  );

  const statCards = hasData
    ? displayData.map(({ valueToString }, index) => (
        <StatCard
          key={infos[index].id}
          title={infos[index].name}
          value={valueToString}
          unit="OGY"
          loading={showSkeleton}
          accessory={
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colors[index] }}
            />
          }
          tooltip={
            <TooltipInfo id={infos[index].id}>{infos[index].value}</TooltipInfo>
          }
          underlineColor={colors[index]}
          active={activeIndex === index}
          onMouseEnter={() => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
        />
      ))
    : null;

  return (
    <SkeletonOverlay loading={showSkeleton}>
      <Card className={className}>
        {hasError && <CardErrorOverlay title={title} />}
        <div data-skel-static className="flex items-center justify-between">
          <div className="text-content text-[22px] font-semibold leading-none">
            {title}
          </div>
          {titleTooltip}
        </div>
        {isEmpty ? (
          <div className="mt-6 h-72">
            <ChartEmptyState title={title} />
          </div>
        ) : layout === "horizontal" ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-6 items-center">
            <div className="flex flex-col">
              {chartBlock}
              {totalBlock}
            </div>
            <div className="flex flex-col gap-4">{statCards}</div>
          </div>
        ) : (
          <>
            {chartBlock}
            {totalBlock}
            <div className="grid grid-cols-1 gap-4 mt-8">{statCards}</div>
          </>
        )}
      </Card>
    </SkeletonOverlay>
  );
};

export default PieStatsCard;
