import { useState, useEffect } from "react";
import {
  useQuery,
  keepPreviousData,
  UseQueryOptions,
} from "@tanstack/react-query";
import { getActor } from "@amerej/artemis-react";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import { TimeStats } from "@hooks/super_stats_v3/declarations";

export interface OGYActivitiesMetricsData {
  transfersPerDay: string;
  transfersPerMonth: string;
  burnsPerDay: string;
  burnsPerMonth: string;
}

const useOGYActivitiesMetrics = ({
  options = {
    placeholderData: keepPreviousData,
    queryKey: ["OGY_ACTIVITIES_METRICS"],
  },
}: {
  start?: number;
  options?: Omit<
    UseQueryOptions<{ statsByDay: TimeStats; statsByMonth: TimeStats }, Error>,
    "queryFn"
  >;
} = {}) => {
  const [metricsData, setMetricsData] = useState<
    OGYActivitiesMetricsData | undefined
  >(undefined);

  const { data, isSuccess, isLoading, isError, error } = useQuery<
    { statsByDay: TimeStats; statsByMonth: TimeStats },
    Error
  >({
    ...options,
    queryKey: ["OGY_ACTIVITIES_METRICS"],
    queryFn: async () => {
      const actor = await getActor("tokenStats", { isAnon: true });

      const statsByMonth = (await actor.get_daily_stats()) as TimeStats;
      const statsByDay = (await actor.get_hourly_stats()) as TimeStats;

      return { statsByDay, statsByMonth };
    },
  });

  useEffect(() => {
    if (isSuccess && data) {
      const { statsByDay, statsByMonth } = data;

      const transfersPerDay = divideBy1e8(
        statsByDay.transfer_stats.total_value
      );
      const burnsPerDay = divideBy1e8(statsByDay.burn_stats.total_value);

      const transfersPerMonth = divideBy1e8(
        statsByMonth.transfer_stats.total_value
      );
      const burnsPerMonth = divideBy1e8(statsByMonth.burn_stats.total_value);

      setMetricsData({
        transfersPerDay: roundAndFormatLocale({ number: transfersPerDay }),
        transfersPerMonth: roundAndFormatLocale({ number: transfersPerMonth }),
        burnsPerDay: roundAndFormatLocale({ number: burnsPerDay }),
        burnsPerMonth: roundAndFormatLocale({ number: burnsPerMonth }),
      });
    }
  }, [isSuccess, data]);

  return {
    data: metricsData,
    isSuccess: isSuccess && !!metricsData,
    isError,
    isLoading,
    error,
  };
};

export default useOGYActivitiesMetrics;
