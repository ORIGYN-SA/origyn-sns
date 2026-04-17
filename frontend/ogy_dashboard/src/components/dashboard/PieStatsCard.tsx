import { ReactNode } from "react";
import { Card, TooltipInfo, SkeletonOverlay } from "@components/ui";
import PieChart, { PieChartData } from "@components/charts/pie/Pie";
import { usePieChart } from "@components/charts/pie/context";
import { FAKE_PIE_SERIES, FAKE_STAT_VALUE } from "@helpers/skeleton/fakeData";
import Stat from "./Stat";
import StatCard from "./StatCard";

type SegmentInfo = {
  id: string;
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
  isError: boolean;
  errorMessage?: string;
  className?: string;
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
  isError,
  errorMessage,
  className,
}: PieStatsCardProps) => {
  const { activeIndex, setActiveIndex } = usePieChart();
  const displayData =
    loading && !data ? FAKE_PIE_SERIES.slice(0, infos.length) : data;
  const displayTotal =
    loading && totalValue == null ? FAKE_STAT_VALUE : totalValue;
  const hasData = !!displayData && displayData.length > 0;

  return (
    <SkeletonOverlay loading={loading}>
      <Card className={className}>
        {isError && errorMessage && (
          <div className="bg-rose-500 rounded-xl text-white font-bold mb-8 p-6">
            {errorMessage}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="text-charcoal text-[22px] font-semibold leading-none">
            {title}
          </div>
          {titleTooltip}
        </div>
        <div data-skel-block className="mt-6 h-72 rounded-xl">
          {hasData ? (
            <PieChart data={displayData} colors={colors} />
          ) : (
            <div className="flex justify-center items-center h-full text-content/60">
              No data
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-4 my-4">
          <h2 className="font-semibold text-[16px] leading-none text-muted">
            {totalLabel}
          </h2>
          <Stat
            iconSrc="/ogy_logo.svg"
            value={displayTotal}
            unit="OGY"
            loading={loading}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 mt-8">
          {hasData &&
            displayData.map(({ name, valueToString }, index) => (
              <StatCard
                key={name}
                title={name}
                value={valueToString}
                unit="OGY"
                loading={loading}
                accessory={
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: colors[index] }}
                  />
                }
                tooltip={
                  <TooltipInfo id={infos[index].id}>
                    {infos[index].value}
                  </TooltipInfo>
                }
                underlineColor={colors[index]}
                active={activeIndex === index}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              />
            ))}
        </div>
      </Card>
    </SkeletonOverlay>
  );
};

export default PieStatsCard;
