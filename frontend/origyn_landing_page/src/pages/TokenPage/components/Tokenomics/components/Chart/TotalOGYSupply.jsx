import { useState } from "react";
import { AreaStatCard } from "@origyn/shared-ui/charts";
import useTotalOGYSupply from "@/hooks/useTotalOGYSupply";

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const TotalOGYSupply = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data, loading, error } = useTotalOGYSupply({ period: selectedPeriod });

  return (
    <AreaStatCard
      className="w-full"
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
      value={data?.totalSupplyOGYToString}
      periodOptions={PERIOD_OPTIONS}
      period={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
      chartData={data?.totalSupplyOGYTimeSeries}
      chartColor="#38bdf8"
      chartLabel="Total Supply"
      loading={loading}
      error={error}
    />
  );
};

export default TotalOGYSupply;
