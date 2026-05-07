import { useState } from "react";
import { AreaStatCard } from "@components/dashboard";
import useTotalOGYSupply from "@hooks/metrics/useTotalOGYSupply";

const SELECT_PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const TotalOGYSupply = ({ className }: { className?: string }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data, isLoading, error } = useTotalOGYSupply({
    period: selectedPeriod,
  });

  return (
    <AreaStatCard
      className={className}
      title="Total OGY Supply"
      tooltipId="tooltip-total-ogy-supply"
      tooltipTitle="Total amount of OGY tokens available."
      tooltipContent={
        <>
          <p>
            This includes the circulating supply and the supply under control of
            the ORIGYN Foundation.
          </p>
          <p>
            As of 18th September, ORIGYN switched to fully deflationary model
            which means no more new minted tokens.
          </p>
        </>
      }
      value={data.totalSupply}
      periodOptions={SELECT_PERIOD_OPTIONS}
      period={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      chartData={data.dataPieChart}
      chartColor="#38bdf8"
      chartLabel="Total Supply"
      loading={isLoading}
      error={error}
    />
  );
};

export default TotalOGYSupply;
