import { useMemo } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { ProcessedTX } from "@hooks/token_metrics/declarations_files/token_metrics";
import fetchTopTransactions from "@services/queries/transactions/fetchTopTransactions";
import { codeAndDecodeAccount, encodeAccount } from "@helpers/charts";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";

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
  const {
    data: rawData,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<ProcessedTX[]> = useQuery<ProcessedTX[], Error>({
    queryKey: ["TOP_TRANSFERS_AND_BURNS", type, limit],
    queryFn: () => fetchTopTransactions({ type, limit }),
    placeholderData: [],
  });

  const data = useMemo<TransformedData[] | undefined>(() => {
    if (!isSuccess || !rawData) return undefined;

    return rawData.slice(0, limit).map((tx) => ({
      hash: tx.hash !== "no-hash" ? tx.hash : "N/A",
      from:
        type === "burns"
          ? codeAndDecodeAccount(tx.from_account)
          : encodeAccount(tx.from_account),
      to: tx.to_account ? encodeAccount(tx.to_account) : "Unknown",
      value:
        tx.tx_value && !isNaN(Number(tx.tx_value))
          ? roundAndFormatLocale({ number: divideBy1e8(tx.tx_value) })
          : "N/A",
      fee:
        tx.tx_fee?.[0] && !isNaN(Number(tx.tx_fee[0]))
          ? roundAndFormatLocale({ number: divideBy1e8(tx.tx_fee[0]) })
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
    }));
  }, [isSuccess, rawData, type, limit]);

  return {
    data,
    isSuccess: isSuccess && !!data,
    isError,
    isLoading,
    error,
  };
};

export default useTopTransfersAndBurns;
