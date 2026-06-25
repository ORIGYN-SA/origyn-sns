import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  divideBy1e8,
  roundAndFormatLocale,
  fetchSupplyHistory,
  fetchLatestSupplyHistory,
  toSupplySeries,
} from "../services/gldtSupplyHistory";

const PRE_SNS_BURNED_OGY = 202420405.1;

export const fetchTotalBurnedOGY = async () => {
  const latest = await fetchLatestSupplyHistory("year");
  const totalBurnedOGY =
    divideBy1e8(latest?.total_burned ?? 0) + PRE_SNS_BURNED_OGY;

  return {
    totalBurnedOGY,
    totalBurnedOGYToString: roundAndFormatLocale(totalBurnedOGY),
  };
};

export const fetchTotalBurnedOGYTimeSeries = async (period = "weekly") => {
  const { items, config } = await fetchSupplyHistory(period);
  return toSupplySeries(items, "total_burned", config).map((entry) => ({
    ...entry,
    value: entry.value + PRE_SNS_BURNED_OGY,
  }));
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

  const loading =
    totalQuery.isLoading || (period ? timeSeriesQuery.isLoading : false);
  const error = totalQuery.error ?? timeSeriesQuery.error;

  return { data, loading, error: error?.message ?? null };
};

export default useTotalOGYBurned;
