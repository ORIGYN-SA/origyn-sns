import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import { TimeStats } from "./types";
// import { roundAndFormatLocale } from "@helpers/numbers";

import { getActor } from "@amerej/artemis-react";

const useGetActiveAccounts = ({ start = 30 }: { start?: number }) => {
  console.log(start);
  const [data] = useState<
    | Array<{
        total_unique_accounts: {
          e8s: bigint;
          number: number;
          string: string;
        };
        start_time: {
          e8s: bigint;
          datetime: DateTime;
        };
      }>
    | undefined
  >(undefined);

  const {
    data: response,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<TimeStats> = useQuery({
    queryFn: async (): Promise<TimeStats> => {
      const actor = await getActor("tokenStats", { isAnon: true });
      const results = await actor.get_daily_stats();
      return results as TimeStats;
    },
    placeholderData: keepPreviousData,
    queryKey: ["GET_ACTIVE_ACCOUNTS"],
  });

  useEffect(() => {
    if (isSuccess && response) {
      console.log(response);
      // const results = response.map((r) => {
      //   const number = Number(r.total_unique_accounts) + 26000;
      //   const datetime = DateTime.fromMillis(Number(r.start_time) / 1000000);
      //   return {
      //     total_unique_accounts: {
      //       e8s: r.total_unique_accounts,
      //       number,
      //       string: roundAndFormatLocale({ number: number }),
      //     },
      //     start_time: {
      //       e8s: r.start_time,
      //       datetime,
      //     },
      //   };
      // });
      // setData(results);
    }
  }, [isSuccess, response]);

  return {
    data,
    isSuccess: isSuccess && data,
    isError,
    isLoading: isLoading || !data,
    error,
  };
};

export default useGetActiveAccounts;
