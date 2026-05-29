import { useState } from "react";
import ChartStatsCard from "./ChartStatsCard";
import useTotalTokensStake from "@hooks/metrics/useTotalTokensStakes";
import { useT } from "@i18n/LocaleContext";

type StakingOverviewChartProps = {
  title?: string;
  chartColor?: string;
  className?: string;
};

const StakingOverviewChart = ({
  title,
  chartColor = "#34d399",
  className,
}: StakingOverviewChartProps) => {
  const t = useT();
  const selectPeriodOptions = [
    { value: "7", label: t("charts.period.weekly") },
    { value: "30", label: t("charts.period.monthly") },
    { value: "365", label: t("charts.period.yearly") },
  ];
  const [selectedDays, setSelectedDays] = useState("30");
  const { data, isLoading, isError } = useTotalTokensStake({
    start: Number(selectedDays),
  });

  return (
    <ChartStatsCard
      className={className}
      title={title ?? t("charts.stakingOverview.title")}
      periodOptions={selectPeriodOptions}
      period={selectedDays}
      onPeriodChange={setSelectedDays}
      stats={[
        {
          id: "total-tokens-in-stakes",
          label: t("charts.stakingOverview.totalTokensInStakes"),
          tooltipContent: <p>{t("charts.stakingOverview.tooltip")}</p>,
          value: data?.total,
          unit: "OGY",
        },
      ]}
      chart={{
        data: data?.dataChart,
        color: chartColor,
        label: t("charts.stakingOverview.stakedTokens"),
      }}
      legendLabel={t("charts.stakingOverview.stakedTokensLegend")}
      loading={isLoading}
      isError={isError}
    />
  );
};

export default StakingOverviewChart;
