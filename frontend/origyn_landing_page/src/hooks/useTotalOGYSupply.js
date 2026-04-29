import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  divideBy1e8,
  getIcrcApiConfig,
  getTimeSeriesPeriod,
  roundAndFormatLocale,
  transformTimeSeriesData,
} from "./tokenMetricsUtils";

export const fetchTotalOGYSupply = async () => {
  const { apiBaseUrl, snsLedgerCanisterId } = getIcrcApiConfig();

  const response = await fetch(
    `${apiBaseUrl}/ledgers/${snsLedgerCanisterId}/total-supply`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch total OGY supply");
  }

  const payload = await response.json();
  const totalSupplyRaw = Number(payload?.data?.[0]?.[1] ?? 0);
  const totalSupplyOGY = divideBy1e8(totalSupplyRaw);

  return {
    totalSupplyOGY,
    totalSupplyOGYToString: roundAndFormatLocale(totalSupplyOGY),
  };
};

export const fetchTotalOGYSupplyTimeSeries = async (period = "weekly") => {
  const { apiBaseUrl, snsLedgerCanisterId } = getIcrcApiConfig();
  const selectedPeriod = getTimeSeriesPeriod(period);

  const response = await fetch(
    `${apiBaseUrl}/ledgers/${snsLedgerCanisterId}/total-supply?start=${selectedPeriod.start}&step=${selectedPeriod.step}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch total OGY supply time series");
  }

  const payload = await response.json();

  return transformTimeSeriesData(payload?.data ?? [], selectedPeriod.step);
};

const useTotalOGYSupply = ({ period } = {}) => {
  const totalQuery = useQuery({
    queryKey: ["totalOGYSupply"],
    queryFn: fetchTotalOGYSupply,
    placeholderData: keepPreviousData,
  });

  const timeSeriesQuery = useQuery({
    queryKey: ["totalOGYSupplyTimeSeries", period],
    queryFn: () => fetchTotalOGYSupplyTimeSeries(period),
    enabled: Boolean(period),
    placeholderData: keepPreviousData,
  });

  const data = totalQuery.data
    ? {
        ...totalQuery.data,
        totalSupplyOGYTimeSeries: period ? timeSeriesQuery.data ?? null : null,
      }
    : undefined;

  const loading = totalQuery.isLoading || (period ? timeSeriesQuery.isLoading : false);
  const error = totalQuery.error ?? timeSeriesQuery.error;

  return { data, loading, error: error?.message ?? null };
};

export default useTotalOGYSupply;
