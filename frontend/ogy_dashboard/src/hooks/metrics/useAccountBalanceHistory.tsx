import { useState, useEffect } from "react";
import {
  useQuery,
  UseQueryResult,
  keepPreviousData,
} from "@tanstack/react-query";
import { DateTime } from "luxon";
import fetchAccountBalanceHistory from "@services/queries/metrics/fetchAccountBalanceHistory";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers/index";
import { ChartData } from "@services/types/charts.types";
import { HistoryData } from "@services/types/token_metrics";

const useAccountBalanceHistory = ({
  account,
  days = 30,
}: {
  account: string;
  days?: number;
}) => {
  const [data, setData] = useState<
    { total: string; dataChart: ChartData[] } | undefined
  >(undefined);
  const {
    data: response,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<Array<[bigint, HistoryData]>> = useQuery({
    queryKey: ["accountBalanceHistory", account, days],
    queryFn: () => fetchAccountBalanceHistory({ account, days }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isSuccess && response) {
      const firstNonZero = response.findIndex((r) => r[1].balance > 0n);
      const trimmed =
        firstNonZero > 0 ? response.slice(firstNonZero) : response;
      const format = days > 90 ? "LLL yyyy" : "LLL dd";
      const results = trimmed.map((r) => {
        const name = DateTime.fromMillis(0)
          .plus({ days: Number(r[0]) })
          .toFormat(format);
        const value = divideBy1e8(r[1].balance);
        return {
          name,
          value,
          valueToString: roundAndFormatLocale({ number: value, decimals: 3 }),
        };
      });
      setData({
        dataChart: results,
        total: results[results.length - 1]?.valueToString ?? "0",
      });
    }
  }, [isSuccess, response, days]);

  return {
    data,
    isSuccess: isSuccess && data,
    isError,
    isLoading: isLoading || (!data && !isError),
    error,
  };
};

export default useAccountBalanceHistory;
