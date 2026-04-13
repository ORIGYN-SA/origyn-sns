import { useState } from "react";
import { Card } from "@components/ui";
import { CardHeader, PeriodSelect, Stat } from "@components/dashboard";
import AreaChart from "@components/charts/area/Area";
import ChartLoader from "@components/charts/utils/Loader";
import ChartError from "@components/charts/utils/Error";
import useTotalOGYTransferred from "@hooks/metrics/useTotalOGYTransferred";

const SELECT_PERIOD_OPTIONS = [
  { value: "7", label: "Weekly" },
  { value: "30", label: "Monthly" },
  { value: "365", label: "Yearly" },
];

const CHART_FILL = "#4ade80";

const TotalOGYTransferred = ({ className }: { className?: string }) => {
  const [selectedDays, setSelectedDays] = useState("30");
  const { data, isSuccess, isLoading, isError } = useTotalOGYTransferred({
    start: Number(selectedDays),
  });

  const totalTransferred = data
    ? data
        .reduce((sum, item) => sum + item.transfer_count.number, 0)
        .toLocaleString()
    : "0";

  const timeSeriesData = data
    ? data.map((item) => ({
        name: item.start_time.datetime.toFormat("LLL dd"),
        value: item.transfer_count.number,
      }))
    : [];

  return (
    <Card className={`flex flex-col ${className}`}>
      {isError && (
        <ChartError>Error while fetching governance staking data.</ChartError>
      )}
      {isLoading && <ChartLoader />}
      {isSuccess && !isLoading && (
        <>
          <CardHeader
            title="Total OGY Transferred"
            subtitle={
              <Stat
                iconSrc="/ogy_logo.svg"
                value={totalTransferred}
                unit="OGY"
              />
            }
            right={
              <PeriodSelect
                options={SELECT_PERIOD_OPTIONS}
                value={selectedDays}
                onChange={setSelectedDays}
              />
            }
          />
          <div className="mt-4 flex-1 min-h-72 w-full rounded-xl">
            <AreaChart data={timeSeriesData} fill={CHART_FILL} />
          </div>
        </>
      )}
    </Card>
  );
};

export default TotalOGYTransferred;
