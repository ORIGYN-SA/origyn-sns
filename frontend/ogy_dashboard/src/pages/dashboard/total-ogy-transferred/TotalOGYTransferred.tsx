import { useState } from "react";
import { AreaStatCard } from "@components/dashboard";
import useTotalOGYTransferred from "@hooks/metrics/useTotalOGYTransferred";

const SELECT_PERIOD_OPTIONS = [
  { value: "7", label: "Weekly" },
  { value: "30", label: "Monthly" },
  { value: "365", label: "Yearly" },
];

const TotalOGYTransferred = ({ className }: { className?: string }) => {
  const [selectedDays, setSelectedDays] = useState("30");
  const { data, isLoading } = useTotalOGYTransferred({
    start: Number(selectedDays),
  });

  const totalTransferred = data
    ? data
        .reduce((sum, item) => sum + item.transfer_count.number, 0)
        .toLocaleString()
    : undefined;

  const chartData = data?.map((item) => ({
    name: item.start_time.datetime.toFormat("LLL dd"),
    value: item.transfer_count.number,
  }));

  return (
    <AreaStatCard
      className={className}
      title="Total OGY Transferred"
      value={totalTransferred}
      periodOptions={SELECT_PERIOD_OPTIONS}
      period={selectedDays}
      onPeriodChange={setSelectedDays}
      chartData={chartData}
      chartColor="#4ade80"
      chartLabel="Total Transferred"
      loading={isLoading}
    />
  );
};

export default TotalOGYTransferred;
