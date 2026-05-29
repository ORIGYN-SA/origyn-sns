import { useState } from "react";
import { AreaStatCard } from "@components/dashboard";
import useTotalOGYBurned from "@hooks/metrics/useTotalOGYBurned";
import { useT } from "@i18n/LocaleContext";

const TotalOGYBurned = ({ className }: { className?: string }) => {
  const t = useT();
  const selectPeriodOptions = [
    { value: "weekly", label: t("charts.period.weekly") },
    { value: "monthly", label: t("charts.period.monthly") },
    { value: "yearly", label: t("charts.period.yearly") },
  ];
  const [selectedPeriod, setSelectedPeriod] = useState("yearly");
  const { data, isLoading, error } = useTotalOGYBurned({
    period: selectedPeriod,
  });

  return (
    <AreaStatCard
      className={className}
      title={t("dashboard.totalBurned.title")}
      tooltipId="tooltip-total-ogy-burned"
      tooltipTitle={t("dashboard.totalBurned.tooltipTitle")}
      tooltipContent={
        <>
          <p>{t("dashboard.totalBurned.tooltipLine1")}</p>
          <p>{t("dashboard.totalBurned.tooltipLine2")}</p>
        </>
      }
      value={data.totalBurned}
      periodOptions={selectPeriodOptions}
      period={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      chartData={data.dataPieChart}
      chartColor="#34d399"
      chartLabel={t("dashboard.totalBurned.chartLabel")}
      loading={isLoading}
      error={error}
    />
  );
};

export default TotalOGYBurned;
