import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getActor } from "@amerej/artemis-react";
import { DateTime } from "luxon";

interface TimeChunkStats {
  start_time: bigint;
  total_count: bigint;
  transfer_count: bigint;
}

interface TimeStats {
  count_over_time: TimeChunkStats[];
  total_transaction_count: bigint;
}

interface DataChart {
  name: string;
  value: number;
}

interface TransactionStats {
  total: string;
  dataChart: DataChart[];
}

const useGetTransactionStats = ({ period }: { period: string }) => {
  const days = period === "weekly" ? 7 : period === "monthly" ? 30 : 365;

  const { data, isLoading, isError }: UseQueryResult<TransactionStats> =
    useQuery<TransactionStats, Error>({
      queryKey: ["TRANSACTION_STATS", period],
      queryFn: async (): Promise<TransactionStats> => {
        const actor = await getActor("tokenStats", { isAnon: true });
        const results = await actor.get_daily_stats();
        const { count_over_time } = results as TimeStats;

        const filteredData: DataChart[] = count_over_time
          .slice(0, days)
          .map((stat) => ({
            name: DateTime.fromMillis(
              Number(stat.start_time || 0n) / 1e6
            ).toFormat("LLL dd"),
            value: Number(stat.transfer_count || 0n),
          }));

        const total: string = filteredData
          .reduce((sum, item) => sum + item.value, 0)
          .toLocaleString("en-US");

        return {
          total,
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
  };
};

export default useGetTransactionStats;
