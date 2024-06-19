import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import { useCanister } from "@amerej/connect2ic-react";
import fetchStakeHistory from "@services/queries/metrics/fetchStakeHistory";
import { HistoryData } from "@services/types/token_metrics";
import { ChartData } from "@services/types/charts.types";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers/index";

const useTotalTokensStakes = ({ start = 30 }: { start: number }) => {
  const [tokenMetricsActor] = useCanister("tokenMetrics");
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
    queryKey: ["totalTokensStakes"],
    queryFn: () =>
      fetchStakeHistory({
        actor: tokenMetricsActor,
        start,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isSuccess && response) {
      const results = response.map((r) => {
        const name = DateTime.fromMillis(0)
          .plus({ days: Number(r[0]) })
          .toFormat("LLL dd");
        const value = divideBy1e8(r[1].balance);
        return {
          name,
          value: divideBy1e8(r[1].balance),
          valueToString: roundAndFormatLocale({ number: value }),
        };
      });
      setData({
        dataChart: results,
        total: results[results.length - 1].valueToString,
      });
    }
  }, [isSuccess, response]);

  return {
    data,
    isSuccess: isSuccess && data,
    isError,
    isLoading: isLoading || (!data && !isError),
    error,
  };
};

export default useTotalTokensStakes;
