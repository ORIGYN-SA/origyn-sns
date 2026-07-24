import { useState } from "react";
import { AreaStatCard } from "@origyn/shared-ui/charts";
import useTotalOGYBurned from "@/hooks/useTotalOGYBurned";

const PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const TotalOGYBurned = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data, loading, error } = useTotalOGYBurned({ period: selectedPeriod });

  return (
    <AreaStatCard
      className="w-full"
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
      value={data?.totalBurnedOGYToString}
      periodOptions={PERIOD_OPTIONS}
      period={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      chartData={data?.totalBurnedOGYTimeSeries}
      chartColor="#34d399"
      chartLabel="Total Burned"
      loading={loading}
      error={error}
    />
  );
};

export default TotalOGYBurned;
