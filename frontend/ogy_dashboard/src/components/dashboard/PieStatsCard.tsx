import { ReactNode } from "react";
import { Card, TooltipInfo } from "@components/ui";
import Skeleton from "@components/ui/SkeletonShadcn";
import PieChart, { PieChartData } from "@components/charts/pie/Pie";
import { usePieChart } from "@components/charts/pie/context";
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
  isLoading: boolean;
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
  isLoading,
  isError,
  errorMessage,
  className,
}: PieStatsCardProps) => {
  const { activeIndex, setActiveIndex } = usePieChart();
  const hasData = !!data && data.length > 0;

  return (
    <Card className={className}>
      {isError && errorMessage && (
        <div className="bg-rose-500 rounded-xl text-white font-bold mb-8 p-6">
          {errorMessage}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{title}</div>
        {titleTooltip}
      </div>
      <div className="mt-6 h-72 rounded-xl">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : hasData ? (
          <PieChart data={data} colors={colors} />
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
          value={totalValue}
          unit="OGY"
          loading={isLoading}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 mt-8">
        {isLoading
          ? infos.map((info, index) => (
              <StatCard
                key={info.id}
                loading
                underlineColor={colors[index]}
              />
            ))
          : hasData &&
            data.map(({ name, valueToString }, index) => (
              <StatCard
                key={name}
                title={name}
                value={valueToString}
                unit="OGY"
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
  );
};

export default PieStatsCard;
