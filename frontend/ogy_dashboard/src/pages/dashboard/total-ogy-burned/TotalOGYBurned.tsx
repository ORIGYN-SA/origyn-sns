import { useState } from "react";
import { AreaStatCard } from "@components/dashboard";
import useTotalOGYBurned from "@hooks/metrics/useTotalOGYBurned";

const SELECT_PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const TotalOGYBurned = ({ className }: { className?: string }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("yearly");
  const { data, isLoading, error } = useTotalOGYBurned({
    period: selectedPeriod,
  });

  return (
    <AreaStatCard
      className={className}
      title="Total OGY Burned"
      tooltipId="tooltip-total-ogy-burned"
      tooltipTitle="Total amount of OGY tokens burned."
      tooltipContent={
        <>
          <p>
            These tokens have been burned completely and are no longer
            available.
          </p>
          <p>
            Tokens can be burned for different reasons for example certificate
            minting fees, network utility fees or network transactions fees.
          </p>
        </>
      }
      value={data.totalBurned}
      periodOptions={SELECT_PERIOD_OPTIONS}
      period={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      chartData={data.dataPieChart}
      chartColor="#34d399"
      chartLabel="Total Burned"
      loading={isLoading}
      error={error}
    />
  );
};

export default TotalOGYBurned;
