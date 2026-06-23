import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  divideBy1e8,
  roundAndFormatLocale,
  fetchSupplySummary,
  fetchSupplyHistory,
  toSupplySeries,
} from "../services/gldtSupplyHistory";

export const fetchTotalOGYSupply = async () => {
  const summary = await fetchSupplySummary();
  const totalSupplyOGY = divideBy1e8(summary.total_supply);

  return {
    totalSupplyOGY,
    totalSupplyOGYToString: roundAndFormatLocale(totalSupplyOGY),
  };
};

export const fetchTotalOGYSupplyTimeSeries = async (period = "weekly") => {
  const { items, config } = await fetchSupplyHistory(period);
  return toSupplySeries(items, "total_supply", config);
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
