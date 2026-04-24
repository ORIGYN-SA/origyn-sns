import { useState } from "react";
import useTotalOGYBurned from "@/hooks/useTotalOGYBurned";
import TimeSeriesChart from "./TimeSeriesChart";

const PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const HEADER_TOOLTIP = {
  id: "tooltip-total-ogy-burned",
  content: (
    <>
      <p>
        Total amount of OGY tokens burned. These tokens have been burned
        completely and are no longer available.
      </p>
      <p>
        Tokens can be burned for different reasons, including certificate
        minting fees, network utility fees, or network transaction fees.
      </p>
    </>
  ),
};

const TotalOGYBurned = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data, loading, error } = useTotalOGYBurned({ period: selectedPeriod });

  return (
    <TimeSeriesChart
      title="Total OGY Burned"
      headerTooltip={HEADER_TOOLTIP}
      totalLabel="Current Burned Total"
      totalValue={data?.totalBurnedOGYToString ?? null}
      chartData={data?.totalBurnedOGYTimeSeries ?? null}
      fill="#34d399"
      loading={loading}
      error={error}
      periodOptions={PERIOD_OPTIONS}
      selectedPeriod={selectedPeriod}
      onPeriodChange={setSelectedPeriod}
    />
  );
};

export default TotalOGYBurned;
