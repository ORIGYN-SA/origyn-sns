import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import {
  useQuery,
  keepPreviousData,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { millify } from "@helpers/numbers";
import ogyAPI from "@services/api/ogy";
import { SupplyAccounts } from "./types";

const useGetSupplyAccounts = ({
  start = 30,
  options = {
    placeholderData: keepPreviousData,
    queryKey: ["GET_SUPPLY_ACCOUNTS"],
  },
}: {
  start: number;
  options?: Omit<UseQueryOptions<Array<SupplyAccounts>>, "queryFn">;
}) => {
  const [data, setData] = useState<
    | Array<{
        count: {
          number: number;
          string: string;
        };
        date: {
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
  }: UseQueryResult<Array<SupplyAccounts>> = useQuery({
    ...options,
    queryFn: async () => {
      const { data } = await ogyAPI.get(`/ogy/supply/accounts`);
      return data;
    },
  });

  useEffect(() => {
    if (isSuccess && response) {
      const lenResponse = response.length;
      const filteredRangePeriodResponse = response.slice(lenResponse - start);
      const results = filteredRangePeriodResponse.map((r) => {
        const number = r.count;
        const datetime = DateTime.fromISO(r.date);
        return {
          count: {
            number,
            string: millify(number),
          },
          date: {
            datetime,
          },
        };
      });
      setData(results);
    }
  }, [isSuccess, response, start]);

  return {
    data,
    isSuccess: isSuccess && data,
    isError,
    isLoading: isLoading || (!data && !isError),
    error,
  };
};

export default useGetSupplyAccounts;
