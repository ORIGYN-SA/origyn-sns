import { useMemo, useState } from "react";
import { Card, Select } from "@components/ui";
import AreaChart from "@components/charts/area/Area";
import useTotalOGYTransferred from "@hooks/metrics/useTotalOGYTransferred";
import ChartLoader from "@components/charts/utils/Loader";
import ChartError from "@components/charts/utils/Error";

const SELECT_PERIOD_OPTIONS = [
  { value: "7", label: "Weekly" },
  { value: "30", label: "Monthly" },
  { value: "365", label: "Yearly" },
];

const LABEL_TO_VALUE_MAP: Record<string, string> = SELECT_PERIOD_OPTIONS.reduce(
  (acc, option) => {
    acc[option.label] = option.value;
    return acc;
  },
  {} as Record<string, string>
);

const TotalOGYTransferred = ({
  className,
  ...restProps
}: {
  className?: string;
}) => {
  const [selectedLabel, setSelectedLabel] = useState("Monthly");
  const [timeSeriesData, setTimeSeriesData] = useState<
    { name: string; value: number }[]
  >([]);
  const [totalTransferred, setTotalTransferred] = useState("0");

  const selectedValue = useMemo(
    () => LABEL_TO_VALUE_MAP[selectedLabel] || "30",
    [selectedLabel]
  );

  const { data, isSuccess, isLoading, isError } = useTotalOGYTransferred({
    start: Number(selectedValue),
  });

  const handleOnChangePeriod = (label: string | number) => {
    if (typeof label === "string") {
      setSelectedLabel(label);
    }
  };

  const selectOptions = useMemo(
    () =>
      SELECT_PERIOD_OPTIONS.map((opt) => ({
        value: opt.label,
        label: opt.label,
      })),
    []
  );

  useMemo(() => {
    if (isSuccess && data) {
      const total = data.reduce(
        (sum, item) => sum + item.transfer_count.number,
        0
      );
      setTotalTransferred(total.toLocaleString());
      setTimeSeriesData(
        data.map((item) => ({
          name: item.start_time.datetime.toFormat("LLL dd"),
          value: item.transfer_count.number,
        }))
      );
    }
  }, [isSuccess, data]);

  const chartFillColor = useMemo(() => "#4ade80", []);

  return (
    <Card className={`${className}`} {...restProps}>
      {isError && (
        <ChartError>Error while fetching governance staking data.</ChartError>
      )}
      {isLoading && <ChartLoader />}
      {isSuccess && !isLoading && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-content/60">
              Total OGY Transferred
            </h2>
            <Select
              options={selectOptions}
              value={selectedLabel}
              handleOnChange={handleOnChangePeriod}
              className="w-25"
            />
          </div>
          <div className="mt-4 flex items-center text-2xl font-semibold">
            <img src="/ogy_logo.svg" alt="OGY Logo" />
            <span className="ml-2 mr-3">{totalTransferred}</span>
            <span className="text-content/60">OGY</span>
          </div>
          <div className="mt-6 h-72">
            <AreaChart data={timeSeriesData} fill={chartFillColor} />
          </div>
        </>
      )}
    </Card>
  );
};

export default TotalOGYTransferred;
