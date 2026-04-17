import { useState } from "react";
import { AreaStatCard } from "@components/dashboard";
import { SkeletonOverlay } from "@components/ui";
import { FAKE_AREA_SERIES, FAKE_STAT_VALUE } from "@helpers/skeleton/fakeData";
import useTotalOGYSupply from "@hooks/metrics/useTotalOGYSupply";

const SELECT_PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const TotalOGYSupply = ({ className }: { className?: string }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const { data, isLoading } = useTotalOGYSupply({ period: selectedPeriod });

  return (
    <SkeletonOverlay loading={isLoading}>
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
        value={isLoading ? FAKE_STAT_VALUE : data.totalSupply}
        periodOptions={SELECT_PERIOD_OPTIONS}
        period={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        chartData={isLoading ? FAKE_AREA_SERIES : data.dataPieChart}
        chartColor="#38bdf8"
        chartLabel="Total Supply"
      />
    </SkeletonOverlay>
  );
};

export default TotalOGYSupply;
