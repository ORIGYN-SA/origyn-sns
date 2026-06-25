import { useState } from "react";
import { AreaStatCard } from "@components/dashboard";
import useTotalOGYSupply from "@hooks/metrics/useTotalOGYSupply";
import { useT } from "@i18n/LocaleContext";

const TotalOGYSupply = ({ className }: { className?: string }) => {
  const t = useT();
  const selectPeriodOptions = [
    { value: "daily", label: t("charts.period.daily") },
    { value: "weekly", label: t("charts.period.weekly") },
    { value: "monthly", label: t("charts.period.monthly") },
    { value: "yearly", label: t("charts.period.yearly") },
  ];
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const { data, isLoading, error } = useTotalOGYSupply({
    period: selectedPeriod,
  });

  return (
    <AreaStatCard
      className={className}
      title={t("dashboard.totalSupply.title")}
      tooltipId="tooltip-total-ogy-supply"
      tooltipTitle={t("dashboard.totalSupply.tooltipTitle")}
      tooltipContent={
        <>
          <p>{t("dashboard.totalSupply.tooltipLine1")}</p>
          <p>{t("dashboard.totalSupply.tooltipLine2")}</p>
        </>
      }
      value={data.totalSupply}
      periodOptions={selectPeriodOptions}
      period={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      chartData={data.dataPieChart}
      chartColor="#38bdf8"
      chartLabel={t("dashboard.totalSupply.chartLabel")}
      loading={isLoading}
      error={error}
    />
  );
};

export default TotalOGYSupply;
