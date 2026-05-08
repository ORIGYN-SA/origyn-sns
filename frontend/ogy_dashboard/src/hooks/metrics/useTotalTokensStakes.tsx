import { useMemo } from "react";
import { DateTime } from "luxon";
import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import fetchStakeHistory from "@services/queries/metrics/fetchStakeHistory";
import { HistoryData } from "@services/types/token_metrics";
import { ChartData } from "@services/types/charts.types";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers/index";

const useTotalTokensStakes = ({ start = 30 }: { start: number }) => {
  const {
    data: response,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<Array<[bigint, HistoryData]>> = useQuery({
    queryKey: ["totalTokensStakes", start],
    queryFn: () =>
      fetchStakeHistory({
        start,
      }),
    placeholderData: keepPreviousData,
  });

  const data = useMemo<
    { total: string; dataChart: ChartData[] } | undefined
  >(() => {
    if (!isSuccess || !response) return undefined;
    const results = response.map((r) => {
      const name = DateTime.fromMillis(0)
        .plus({ days: Number(r[0]) })
        .toFormat("LLL dd");
      const value = divideBy1e8(r[1].balance);
      return {
        name,
        value,
        valueToString: roundAndFormatLocale({ number: value }),
      };
    });
    return {
      dataChart: results,
      total: results[results.length - 1]?.valueToString ?? "0",
    };
  }, [isSuccess, response]);

  return {
    data,
    isSuccess: isSuccess && !!data,
    isError,
    isLoading: isLoading || (!data && !isError),
    error,
  };
};

export default useTotalTokensStakes;
