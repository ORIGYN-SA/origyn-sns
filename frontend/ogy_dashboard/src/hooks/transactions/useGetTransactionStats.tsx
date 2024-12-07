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

        const sortedData = count_over_time
          .slice(0, days)
          .sort((a, b) => Number(a.start_time) - Number(b.start_time));

        const filteredData = sortedData.map((stat) => {
          const name = DateTime.fromMillis(
            Number(stat.start_time) / 1e6
          ).toFormat("LLL dd");
          const value = Number(stat.transfer_count);
          return { name, value };
        });

        const total = filteredData
          .reduce((acc, cur) => acc + cur.value, 0)
          .toString();

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
