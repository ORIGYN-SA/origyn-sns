import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import {
  useQuery,
  keepPreviousData,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { ActorSubclass } from "@dfinity/agent";
import { ActivitySnapshot } from "./types";
import { millify } from "@helpers/numbers";

const useGetActivityStats = ({
  actor,
  start = 30,
  options = {
    placeholderData: keepPreviousData,
    queryKey: ["GET_ACTIVITY_STATS"],
  },
}: {
  start?: number;
  actor: ActorSubclass;
  options?: Omit<UseQueryOptions<Array<ActivitySnapshot>>, "queryFn">;
}) => {
  const [data, setData] = useState<
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
  }: UseQueryResult<Array<ActivitySnapshot>> = useQuery({
    ...options,
    queryFn: async (): Promise<Array<ActivitySnapshot>> => {
      const results = await actor.get_activity_stats(start);
      return results as Array<ActivitySnapshot>;
    },
  });

  useEffect(() => {
    if (isSuccess && response) {
      const results = response.map((r) => {
        const number = Number(r.total_unique_accounts) + 26000;
        const datetime = DateTime.fromMillis(Number(r.start_time) / 1000000);
        return {
          total_unique_accounts: {
            e8s: r.total_unique_accounts,
            number,
            string: millify(number),
          },
          start_time: {
            e8s: r.start_time,
            datetime,
          },
        };
      });
      setData(results);
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

export default useGetActivityStats;
