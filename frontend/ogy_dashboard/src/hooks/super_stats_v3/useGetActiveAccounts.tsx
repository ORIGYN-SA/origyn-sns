import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { getActor } from "@amerej/artemis-react";
import { ActivitySnapshot } from "./declarations";

interface TimeChunkStats {
  start_time: bigint;
  total_count: bigint;
}

interface TimeStats {
  count_over_time: TimeChunkStats[];
  total_unique_accounts: bigint;
}

interface ActiveAccountsData {
  total: string;
  dataChart: { name: string; value: number }[];
}

const useGetActiveAccounts = ({ period }: { period: string }) => {
  const days = period === "weekly" ? 7 : period === "monthly" ? 30 : 365;

  const {
    data,
    isLoading,
    isError,
    error,
  }: UseQueryResult<ActiveAccountsData, Error> = useQuery<
    ActiveAccountsData,
    Error
  >({
    queryKey: ["ACTIVE_ACCOUNTS", period],
    queryFn: async (): Promise<ActiveAccountsData> => {
      const actor = await getActor("tokenStats", { isAnon: true });
      const results = await actor.get_daily_stats();
      const activityStatsResults = (await actor.get_activity_stats(
        BigInt(days)
      )) as Array<ActivitySnapshot>;
      const { count_over_time } = results as TimeStats;

      const sortedData = count_over_time
        .slice(0, days)
        .sort((a, b) => Number(a.start_time) - Number(b.start_time));

      const filteredData = sortedData.slice(0, days).map((stat) => {
        const name = DateTime.fromMillis(
          Number(stat.start_time) / 1e6
        ).toFormat("LLL dd");
        const value = Number(stat.total_count);
        return { name, value };
      });

      const lastActivitySnapshot =
        activityStatsResults[activityStatsResults.length - 1];

      const totalUniqueAccounts = lastActivitySnapshot
        ? lastActivitySnapshot.total_unique_accounts.toString()
        : "0";

      return {
        total: totalUniqueAccounts,
        dataChart: filteredData,
      };
    },
    placeholderData: {
      total: "0",
      dataChart: [],
    },
  });

  return {
    data,
    isLoading,
    isError,
    isSuccess: !!data,
    error,
  };
};

export default useGetActiveAccounts;
