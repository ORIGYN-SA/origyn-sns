import { useState } from "react";
import { AreaStatCard } from "@components/dashboard";
import { SkeletonOverlay } from "@components/ui";
import { FAKE_AREA_SERIES, FAKE_STAT_VALUE } from "@helpers/skeleton/fakeData";
import useTotalOGYBurned from "@hooks/metrics/useTotalOGYBurned";

const SELECT_PERIOD_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const TotalOGYBurned = ({ className }: { className?: string }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("yearly");
  const { data, isLoading } = useTotalOGYBurned({ period: selectedPeriod });

  return (
    <SkeletonOverlay loading={isLoading}>
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
        value={isLoading ? FAKE_STAT_VALUE : data.totalBurned}
        periodOptions={SELECT_PERIOD_OPTIONS}
        period={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        chartData={isLoading ? FAKE_AREA_SERIES : data.dataPieChart}
        chartColor="#34d399"
        chartLabel="Total Burned"
      />
    </SkeletonOverlay>
  );
};

export default TotalOGYBurned;
