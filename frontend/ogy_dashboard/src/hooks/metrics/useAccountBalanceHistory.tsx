import { useState, useEffect } from "react";
import {
  useQuery,
  UseQueryResult,
  keepPreviousData,
} from "@tanstack/react-query";
import { DateTime } from "luxon";
import fetchAccountBalanceHistory from "@services/queries/metrics/fetchAccountBalanceHistory";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers/index";
import { useCanister } from "@amerej/connect2ic-react";
import { ChartData } from "@services/types/charts.types";
import { HistoryData } from "@services/types/token_metrics";

const useAccountBalanceHistory = ({ account }: { account: string }) => {
  const [data, setData] = useState<
    { total: string; dataChart: ChartData[] } | undefined
  >(undefined);
  const [statsActor] = useCanister("tokenStats");

  const {
    data: response,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<Array<[bigint, HistoryData]>> = useQuery({
    queryKey: ["accountBalanceHistory", account],
    queryFn: () => fetchAccountBalanceHistory({ account, actor: statsActor }),
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
          value,
          valueToString: roundAndFormatLocale({ number: value, decimals: 3 }),
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

export default useAccountBalanceHistory;
