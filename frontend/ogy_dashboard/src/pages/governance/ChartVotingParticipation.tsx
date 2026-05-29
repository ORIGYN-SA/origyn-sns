import { useState } from "react";
import { ChartStatsCard } from "@components/dashboard";
import useVotingParticipationData from "@hooks/metrics/useVotingParticipationData";
import { useT } from "@i18n/LocaleContext";

const ChartVotingParticipation = ({ className }: { className?: string }) => {
  const t = useT();
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data, isLoading, isError } = useVotingParticipationData({
    period: selectedPeriod,
  });

  const selectPeriodOptions = [
    { value: "weekly", label: t("governance.votingParticipation.period.weekly") },
    { value: "monthly", label: t("governance.votingParticipation.period.monthly") },
    { value: "yearly", label: t("governance.votingParticipation.period.yearly") },
  ];

  return (
    <ChartStatsCard
      className={className}
      title={t("governance.votingParticipation.title")}
      periodOptions={selectPeriodOptions}
      period={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      stats={[
        {
          id: "last-voting-participation",
          label: t("governance.votingParticipation.lastParticipation.label"),
          tooltipContent: (
            <p>{t("governance.votingParticipation.lastParticipation.tooltip")}</p>
          ),
          value: data?.lastParticipation,
        },
        {
          id: "average-voting-participation",
          label: t("governance.votingParticipation.averageParticipation.label"),
          tooltipContent: (
            <p>
              {t("governance.votingParticipation.averageParticipation.tooltip")}
            </p>
          ),
          value: data?.averageParticipation,
        },
        {
          id: "average-voting-power",
          label: t("governance.votingParticipation.averagePower.label"),
          tooltipContent: (
            <p>{t("governance.votingParticipation.averagePower.tooltip")}</p>
          ),
          value: data?.averagePower,
        },
      ]}
      chart={{
        data: data?.dataChart,
        color: "#34d399",
        label: t("governance.votingParticipation.chartLabel"),
      }}
      legendLabel={t("governance.votingParticipation.legendLabel")}
      loading={isLoading}
      isError={isError}
    />
  );
};

export default ChartVotingParticipation;
