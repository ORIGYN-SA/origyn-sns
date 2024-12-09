import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import {
  useQuery,
  keepPreviousData,
  UseQueryOptions,
} from "@tanstack/react-query";
import { getActor } from "@amerej/artemis-react";
import { TimeStats } from "@hooks/super_stats_v3/declarations";

export interface OGYActivitiesMetricsData {
  transfersPerDay: string;
  transfersPerMonth: string;
  burnsPerDay: string;
  burnsPerMonth: string;
  transfersTimeSeries: { name: string; value: number }[];
  burnsTimeSeries: { name: string; value: number }[];
}

const useOGYActivitiesMetrics = ({
  options = {
    placeholderData: keepPreviousData,
    queryKey: ["OGY_ACTIVITIES_METRICS"],
  },
}: {
  start?: number;
  options?: Omit<UseQueryOptions<TimeStats>, "queryFn">;
} = {}) => {
  const [metricsData, setMetricsData] = useState<
    OGYActivitiesMetricsData | undefined
  >(undefined);

  const {
    data: rawData,
    isSuccess,
    isLoading,
    isError,
    error,
  } = useQuery<TimeStats, Error>({
    ...options,
    queryFn: async (): Promise<TimeStats> => {
      const actor = await getActor("tokenStats", { isAnon: true });
      const stats = (await actor.get_daily_stats()) as TimeStats;

      return stats;
    },
  });

  useEffect(() => {
    if (isSuccess && rawData) {
      const processedData = rawData.count_over_time.map((chunk) => {
        const date = DateTime.fromMillis(Number(chunk.start_time) / 1e6);
        const transferCount = Number(chunk.transfer_count || 0);
        const burnCount = Number(chunk.burn_count || 0);
        return { date, transferCount, burnCount };
      });

      const transfersPerDay =
        processedData[processedData.length - 1]?.transferCount || 0;
      const transfersPerMonth = processedData
        .slice(-30)
        .reduce((sum, curr) => sum + curr.transferCount, 0);

      const burnsPerDay =
        processedData[processedData.length - 1]?.burnCount || 0;
      const burnsPerMonth = processedData
        .slice(-30)
        .reduce((sum, curr) => sum + curr.burnCount, 0);

      const transfersTimeSeries = processedData.map((item) => ({
        name: item.date.toFormat("LLL dd"),
        value: item.transferCount,
      }));

      const burnsTimeSeries = processedData.map((item) => ({
        name: item.date.toFormat("LLL dd"),
        value: item.burnCount,
      }));

      setMetricsData({
        transfersPerDay: transfersPerDay.toLocaleString(),
        transfersPerMonth: transfersPerMonth.toLocaleString(),
        burnsPerDay: burnsPerDay.toLocaleString(),
        burnsPerMonth: burnsPerMonth.toLocaleString(),
        transfersTimeSeries,
        burnsTimeSeries,
      });
    }
  }, [isSuccess, rawData]);

  return {
    data: metricsData,
    isSuccess: isSuccess && !!metricsData,
    isError,
    isLoading,
    error,
  };
};

export default useOGYActivitiesMetrics;
