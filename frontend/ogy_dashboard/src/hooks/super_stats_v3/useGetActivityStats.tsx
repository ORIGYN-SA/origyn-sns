/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo } from "react";
import { DateTime } from "luxon";
import {
  useQuery,
  keepPreviousData,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { ActivitySnapshot } from "./declarations";
import { roundAndFormatLocale } from "@helpers/numbers";
import { getActor } from "@amerej/artemis-react";
import {
  hardcodedActivityData,
  HardcodedActivity,
} from "./hardcodedActivityData";

export type Period = "all" | "yearly" | "monthly" | "weekly" | "daily";

interface MappedActivityData {
  total_unique_accounts: {
    e8s: bigint;
    number: number;
    string: string;
  };
  start_time: {
    e8s: bigint;
    datetime: DateTime;
  };
}

const useGetActivityStats = ({
  period = "monthly",
  options = {
    placeholderData: keepPreviousData,
    queryKey: ["SUPER_STATS_GET_ACTIVITY_STATS"],
  },
}: {
  period?: Period;
  options?: Omit<UseQueryOptions<Array<ActivitySnapshot>, Error>, "queryFn">;
}) => {
  const [data, setData] = useState<MappedActivityData[]>([]);

  const hardcodedEndDate = DateTime.fromISO("2024-05-26");

  const today = useMemo(() => DateTime.local(), []);

  const periodStartDate = useMemo(() => {
    switch (period) {
      case "all":
        return DateTime.fromISO("2021-11-01");
      case "yearly":
        return today.minus({ years: 1 });
      case "monthly":
        return today.minus({ months: 1 });
      case "daily":
        return today.minus({ days: 1 });
      default:
        return today.minus({ months: 1 });
    }
  }, [period, today]);

  const fetchStartDate = useMemo(() => {
    const dynamicStartDate = hardcodedEndDate.plus({ days: 1 });
    if (period === "all" || period === "yearly") {
      return dynamicStartDate;
    }
    return periodStartDate > dynamicStartDate
      ? periodStartDate
      : dynamicStartDate;
  }, [period, periodStartDate, hardcodedEndDate]);

  const daysToFetch = useMemo(() => {
    return Math.ceil(today.diff(fetchStartDate, "days").days);
  }, [today, fetchStartDate]);

  const shouldFetchDynamicData = daysToFetch > 0;

  const queryKey = useMemo(
    () => ["SUPER_STATS_GET_ACTIVITY_STATS", period, daysToFetch],
    [period, daysToFetch]
  );

  const {
    data: dynamicResponse,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<Array<ActivitySnapshot>, Error> = useQuery<
    Array<ActivitySnapshot>,
    Error
  >({
    ...options,
    queryKey,
    queryFn: async (): Promise<Array<ActivitySnapshot>> => {
      const actor = await getActor("tokenStats", { isAnon: true });
      const results = await actor.get_activity_stats(daysToFetch);
      return results as Array<ActivitySnapshot>;
    },
    enabled: shouldFetchDynamicData,
  });

  useEffect(() => {
    const filteredHardcodedData: ActivitySnapshot[] = hardcodedActivityData
      .filter((item: HardcodedActivity) => {
        const itemDate = DateTime.fromISO(item.date);
        return itemDate >= periodStartDate && itemDate <= hardcodedEndDate;
      })
      .map((item: HardcodedActivity) => ({
        principals_active_during_snapshot: BigInt(0),
        accounts_active_during_snapshot: BigInt(0),
        total_unique_accounts: BigInt(item.count),
        end_time: BigInt(DateTime.fromISO(item.date).toMillis() * 1_000_000),
        start_time: BigInt(DateTime.fromISO(item.date).toMillis() * 1_000_000),
        total_unique_principals: BigInt(0),
      }));

    if (isSuccess && dynamicResponse) {
      const mappedDynamicData: MappedActivityData[] = dynamicResponse.map(
        (r) => {
          const baseNumber = Number(r.total_unique_accounts);
          const datetime = DateTime.fromMillis(
            Number(r.start_time) / 1_000_000
          );

          const number =
            datetime >= hardcodedEndDate.plus({ days: 1 }).startOf("day")
              ? baseNumber + 26000
              : baseNumber;

          return {
            total_unique_accounts: {
              e8s: r.total_unique_accounts,
              number,
              string: roundAndFormatLocale({ number }),
            },
            start_time: {
              e8s: r.start_time,
              datetime,
            },
          };
        }
      );

      let combinedData: MappedActivityData[] = [];

      if (period === "monthly") {
        combinedData = mappedDynamicData;
      } else {
        const mappedHardcodedData: MappedActivityData[] =
          filteredHardcodedData.map((r) => {
            const number = Number(r.total_unique_accounts);
            const datetime = DateTime.fromMillis(
              Number(r.start_time) / 1_000_000
            );
            return {
              total_unique_accounts: {
                e8s: r.total_unique_accounts,
                number,
                string: roundAndFormatLocale({ number }),
              },
              start_time: {
                e8s: r.start_time,
                datetime,
              },
            };
          });

        combinedData = [...mappedHardcodedData, ...mappedDynamicData];
      }

      combinedData.sort(
        (a, b) =>
          a.start_time.datetime.toMillis() - b.start_time.datetime.toMillis()
      );

      setData(combinedData);
    } else if (!shouldFetchDynamicData) {
      const mappedHardcodedData: MappedActivityData[] =
        filteredHardcodedData.map((r) => {
          const number = Number(r.total_unique_accounts);
          const datetime = DateTime.fromMillis(
            Number(r.start_time) / 1_000_000
          );
          return {
            total_unique_accounts: {
              e8s: r.total_unique_accounts,
              number,
              string: roundAndFormatLocale({ number }),
            },
            start_time: {
              e8s: r.start_time,
              datetime,
            },
          };
        });

      setData(mappedHardcodedData);
    }
  }, [
    isSuccess,
    dynamicResponse,
    periodStartDate,
    period,
    shouldFetchDynamicData,
  ]);

  return {
    data,
    isSuccess: isSuccess && data.length > 0,
    isError,
    isLoading: isLoading || (shouldFetchDynamicData && !data),
    error,
  };
};

export default useGetActivityStats;
