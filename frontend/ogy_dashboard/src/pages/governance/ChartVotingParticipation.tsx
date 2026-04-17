import { useState } from "react";
import { ChartStatsCard } from "@components/dashboard";
import { SkeletonOverlay } from "@components/ui";
import { FAKE_AREA_SERIES, FAKE_STAT_VALUE_SMALL } from "@helpers/skeleton/fakeData";
import useVotingParticipationData from "@hooks/metrics/useVotingParticipationData";

const SELECT_PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const ChartVotingParticipation = ({
  className,
}: {
  className?: string;
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data, isLoading, isError } = useVotingParticipationData({
    period: selectedPeriod,
  });

  return (
    <SkeletonOverlay loading={isLoading}>
      <ChartStatsCard
        className={className}
        title="Voting Participation"
        periodOptions={SELECT_PERIOD_OPTIONS}
        period={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        stats={[
          {
            id: "last-voting-participation",
            label: "Last Voting Participation",
            tooltipContent: (
              <p>Percentage of participation in the last voting event.</p>
            ),
            value: isLoading ? FAKE_STAT_VALUE_SMALL : data?.lastParticipation,
          },
          {
            id: "average-voting-participation",
            label: "Average Voting Participation",
            tooltipContent: (
              <p>Average percentage of voting participation over time.</p>
            ),
            value: isLoading
              ? FAKE_STAT_VALUE_SMALL
              : data?.averageParticipation,
          },
          {
            id: "average-voting-power",
            label: "Average Voting Power",
            tooltipContent: (
              <p>Average voting power across all participants.</p>
            ),
            value: isLoading ? FAKE_STAT_VALUE_SMALL : data?.averagePower,
          },
        ]}
        chart={{
          data: isLoading ? FAKE_AREA_SERIES : data?.dataChart,
          color: "#34d399",
          label: "Participation %",
        }}
        legendLabel="PARTICIPATION %"
        isError={isError}
        errorMessage="Error while fetching voting participation data."
      />
    </SkeletonOverlay>
  );
};

export default ChartVotingParticipation;
