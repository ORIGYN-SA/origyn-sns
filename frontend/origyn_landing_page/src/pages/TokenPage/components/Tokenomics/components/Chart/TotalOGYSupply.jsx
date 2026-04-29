import { useState } from "react";
import useTotalOGYSupply from "@/hooks/useTotalOGYSupply";
import TimeSeriesChart from "./TimeSeriesChart";

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const HEADER_TOOLTIP = {
  id: "tooltip-total-ogy-supply",
  content: (
    <>
      <p>
        Total amount of OGY tokens available. This includes the circulating
        supply and the supply under control of the ORIGYN Foundation.
      </p>
      <p>
        As of 18 September, ORIGYN switched to a fully deflationary model,
        which means no more new tokens are minted.
      </p>
    </>
  ),
};

const TotalOGYSupply = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data, loading, error } = useTotalOGYSupply({ period: selectedPeriod });

  return (
    <TimeSeriesChart
      title="Total OGY Supply"
      headerTooltip={HEADER_TOOLTIP}
      totalLabel="Current Total Supply"
      totalValue={data?.totalSupplyOGYToString ?? null}
      chartData={data?.totalSupplyOGYTimeSeries ?? null}
      fill="#38bdf8"
      loading={loading}
      error={error}
      periodOptions={PERIOD_OPTIONS}
      selectedPeriod={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
    />
  );
};

export default TotalOGYSupply;
