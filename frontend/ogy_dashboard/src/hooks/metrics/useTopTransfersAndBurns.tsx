import { useState, useEffect } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getActor } from "@amerej/artemis-react";
import { DateTime } from "luxon";
import { TimeStats } from "@hooks/super_stats_v3/declarations";
import { codeAndDecodeAccount, encodeAccount } from "@helpers/charts";

export interface TransformedData {
  hash: string;
  from: string;
  to?: string;
  value: string;
  fee: string;
  time: string;
}

const useTopTransfersAndBurns = ({
  type = "transfers",
  limit = 25,
}: {
  type?: "transfers" | "burns";
  limit?: number;
} = {}) => {
  const [data, setData] = useState<TransformedData[] | undefined>(undefined);

  const placeholderData: TimeStats = {
    top_transfers: [],
    top_burns: [],
    total_unique_accounts: BigInt(0),
    mint_stats: { count: BigInt(0), average: 0, total_value: BigInt(0) },
    total_transaction_average: 0,
    most_active_principals: [],
    transfer_stats: { count: BigInt(0), average: 0, total_value: BigInt(0) },
    top_mints: [],
    total_transaction_value: BigInt(0),
    most_active_accounts: [],
    count_over_time: [],
    total_transaction_count: BigInt(0),
    total_unique_principals: BigInt(0),
    burn_stats: { count: BigInt(0), average: 0, total_value: BigInt(0) },
    approve_stats: { count: BigInt(0), average: 0, total_value: BigInt(0) },
  };

  const {
    data: rawData,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<TimeStats> = useQuery<TimeStats, Error>({
    queryKey: ["TOP_TRANSFERS_AND_BURNS", type],
    queryFn: async (): Promise<TimeStats> => {
      const actor = await getActor("tokenStats", { isAnon: true });
      const stats = (await actor.get_daily_stats()) as TimeStats;
      return stats;
    },
    placeholderData,
  });

  useEffect(() => {
    if (isSuccess && rawData) {
      const sourceData =
        type === "transfers" ? rawData.top_transfers : rawData.top_burns;

      const transformedData = sourceData
        .slice(0, limit)
        .map((tx) => ({
          hash: tx.hash !== "no-hash" ? tx.hash : "N/A",
          from:
            type === "burns"
              ? codeAndDecodeAccount(tx.from_account)
              : encodeAccount(tx.from_account),
          to: tx.to_account ? encodeAccount(tx.to_account) : "Unknown",
          value:
            tx.tx_value && !isNaN(Number(tx.tx_value))
              ? Number(tx.tx_value).toLocaleString()
              : "N/A",
          fee:
            tx.tx_fee?.[0] && !isNaN(Number(tx.tx_fee[0]))
              ? Number(tx.tx_fee[0]).toLocaleString()
              : "N/A",
          time: tx.tx_time
            ? DateTime.fromMillis(Number(tx.tx_time) / 1e6)
                .setLocale("en-US")
                .toLocaleString({
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
            : "N/A",
        }))
        .sort((a, b) => {
          const valueA = parseFloat(a.value.replace(/,/g, "")) || 0;
          const valueB = parseFloat(b.value.replace(/,/g, "")) || 0;
          return valueB - valueA;
        });

      setData(transformedData);
    }
  }, [isSuccess, rawData, type, limit]);

  return {
    data,
    isSuccess: isSuccess && !!data,
    isError,
    isLoading: isLoading || !data,
    error,
  };
};

export default useTopTransfersAndBurns;
