import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  DAY_IN_SECONDS,
  divideBy1e8,
  getCurrentDateInSeconds,
  getIcrcApiConfig,
  getTimeSeriesPeriod,
  roundAndFormatLocale,
  transformTimeSeriesData,
} from "./tokenMetricsUtils";

const TIMESTAMP_REFERENCE_LAUNCH_SNS = 1717545600;
const PRE_SNS_BURNED_OGY = 202420405.1;

export const fetchTotalBurnedOGY = async () => {
  const { apiBaseUrl, snsLedgerCanisterId } = getIcrcApiConfig();

  const response = await fetch(
    `${apiBaseUrl}/ledgers/${snsLedgerCanisterId}/total-burned-per-day?start=${TIMESTAMP_REFERENCE_LAUNCH_SNS}&end=${getCurrentDateInSeconds()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch total burned OGY");
  }

  const payload = await response.json();
  const totalBurnedSinceSnsLaunch = (payload?.data ?? [])
    .map((entry) => Number(entry?.[1] ?? 0))
    .reduce((total, value) => total + value, 0);

  // Preserve the dashboard's historical pre-SNS burn adjustment.
  const totalBurnedOGY =
    divideBy1e8(totalBurnedSinceSnsLaunch) + PRE_SNS_BURNED_OGY;

  return {
    totalBurnedOGY,
    totalBurnedOGYToString: roundAndFormatLocale(totalBurnedOGY),
  };
};

export const fetchTotalBurnedOGYTimeSeries = async (period = "weekly") => {
  const { apiBaseUrl, snsLedgerCanisterId } = getIcrcApiConfig();
  const selectedPeriod = getTimeSeriesPeriod(period);

  const response = await fetch(
    `${apiBaseUrl}/ledgers/${snsLedgerCanisterId}/total-burned-per-day?start=${TIMESTAMP_REFERENCE_LAUNCH_SNS}&end=${getCurrentDateInSeconds()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch total burned OGY time series");
  }

  const payload = await response.json();
  const transformedData = transformTimeSeriesData(payload?.data ?? [], DAY_IN_SECONDS);
  let runningTotal = PRE_SNS_BURNED_OGY;

  return transformedData
    .map((entry) => {
      runningTotal += entry.value;

      return {
        ...entry,
        value: runningTotal,
      };
    })
    .slice(-selectedPeriod.sliceSize);
};

const useTotalOGYBurned = ({ period } = {}) => {
  const totalQuery = useQuery({
    queryKey: ["totalBurnedOGY"],
    queryFn: fetchTotalBurnedOGY,
    placeholderData: keepPreviousData,
  });

  const timeSeriesQuery = useQuery({
    queryKey: ["totalBurnedOGYTimeSeries", period],
    queryFn: () => fetchTotalBurnedOGYTimeSeries(period),
    enabled: Boolean(period),
    placeholderData: keepPreviousData,
  });

  const data = totalQuery.data
    ? {
        ...totalQuery.data,
        totalBurnedOGYTimeSeries: period ? timeSeriesQuery.data ?? null : null,
      }
    : undefined;

  const loading = totalQuery.isLoading || (period ? timeSeriesQuery.isLoading : false);
  const error = totalQuery.error ?? timeSeriesQuery.error;

  return { data, loading, error: error?.message ?? null };
};

export default useTotalOGYBurned;
