import { useMemo } from "react";
import { DateTime } from "luxon";
import {
  useQuery,
  keepPreviousData,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import { ActivitySnapshot } from "@hooks/token_metrics/declarations_files/token_metrics";
import { roundAndFormatLocale } from "@helpers/numbers";
import fetchActivityStats from "@services/queries/metrics/fetchActivityStats";
import {
  hardcodedActivityData,
  HardcodedActivity,
} from "./hardcodedActivityData";

const HARDCODED_START_DATE = DateTime.fromISO("2021-11-01");
const HARDCODED_END_DATE = DateTime.fromISO("2024-05-26");
const DYNAMIC_START_DATE = HARDCODED_END_DATE.plus({ days: 1 });
const LEGACY_ACTIVITY_OFFSET = 26_000;
const NS_PER_MS = 1_000_000n;

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

const mapActivitySnapshot = (
  snapshot: ActivitySnapshot,
  includeLegacyOffset = false
): MappedActivityData => {
  const datetime = DateTime.fromMillis(Number(snapshot.start_time / NS_PER_MS));
  const baseNumber = Number(snapshot.total_unique_accounts);
  const number =
    includeLegacyOffset && datetime >= DYNAMIC_START_DATE.startOf("day")
      ? baseNumber + LEGACY_ACTIVITY_OFFSET
      : baseNumber;

  return {
    total_unique_accounts: {
      e8s: snapshot.total_unique_accounts,
      number,
      string: roundAndFormatLocale({ number }),
    },
    start_time: {
      e8s: snapshot.start_time,
      datetime,
    },
  };
};

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
  const today = useMemo(() => DateTime.local(), []);

  const periodStartDate = useMemo(() => {
    switch (period) {
      case "all":
        return HARDCODED_START_DATE;
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
    if (period === "all" || period === "yearly") {
      return DYNAMIC_START_DATE;
    }
    return periodStartDate > DYNAMIC_START_DATE
      ? periodStartDate
      : DYNAMIC_START_DATE;
  }, [period, periodStartDate]);

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
    queryFn: (): Promise<Array<ActivitySnapshot>> =>
      fetchActivityStats(daysToFetch),
    enabled: shouldFetchDynamicData,
  });

  const mappedHardcodedData = useMemo(() => {
    return hardcodedActivityData
      .filter((item: HardcodedActivity) => {
        const itemDate = DateTime.fromISO(item.date);
        return itemDate >= periodStartDate && itemDate <= HARDCODED_END_DATE;
      })
      .map((item: HardcodedActivity) =>
        mapActivitySnapshot({
          principals_active_during_snapshot: BigInt(0),
          accounts_active_during_snapshot: BigInt(0),
          total_unique_accounts: BigInt(item.count),
          end_time: BigInt(DateTime.fromISO(item.date).toMillis()) * NS_PER_MS,
          start_time:
            BigInt(DateTime.fromISO(item.date).toMillis()) * NS_PER_MS,
          total_unique_principals: BigInt(0),
        })
      );
  }, [periodStartDate]);

  const data = useMemo(() => {
    if (isSuccess && dynamicResponse) {
      const mappedDynamicData = dynamicResponse.map((snapshot) =>
        mapActivitySnapshot(snapshot, true)
      );
      const combinedData =
        period === "monthly"
          ? [...mappedDynamicData]
          : [...mappedHardcodedData, ...mappedDynamicData];

      combinedData.sort(
        (a, b) =>
          a.start_time.datetime.toMillis() - b.start_time.datetime.toMillis()
      );

      return combinedData;
    }

    if (!shouldFetchDynamicData) {
      return mappedHardcodedData;
    }

    return [];
  }, [
    isSuccess,
    dynamicResponse,
    period,
    shouldFetchDynamicData,
    mappedHardcodedData,
  ]);

  const hasData = data.length > 0;
  const hasLoadedData = (shouldFetchDynamicData ? isSuccess : true) && hasData;

  return {
    data,
    isSuccess: hasLoadedData,
    isError,
    isLoading,
    error,
  };
};

export default useGetActivityStats;
