import { useState } from "react";
import { ChartStatsCard } from "@components/dashboard";
import useTotalTokensStake from "@hooks/metrics/useTotalTokensStakes";

const SELECT_PERIOD_OPTIONS = [
  { value: "7", label: "Weekly" },
  { value: "30", label: "Monthly" },
  { value: "365", label: "Yearly" },
];

const ChartTotalTokensStakes = ({
  className,
}: {
  className?: string;
}) => {
  const [selectedDays, setSelectedDays] = useState("30");
  const { data, isLoading, isError } = useTotalTokensStake({
    start: Number(selectedDays),
  });

  return (
    <ChartStatsCard
      className={className}
      title="Governance Staking Overview"
      periodOptions={SELECT_PERIOD_OPTIONS}
      period={selectedDays}
      onPeriodChange={setSelectedDays}
      stats={[
        {
          id: "total-tokens-in-stakes",
          label: "Total Tokens in Stakes",
          tooltipContent: <p>Tokens that are locked in stakes.</p>,
          value: data?.total,
          unit: "OGY",
        },
      ]}
      chart={{
        data: data?.dataChart,
        color: "#38bdf8",
        label: "Staked Tokens",
      }}
      legendLabel="STAKED TOKENS"
      loading={isLoading}
      isError={isError}
      errorMessage="Error while fetching governance staking data."
    />
  );
};

export default ChartTotalTokensStakes;
