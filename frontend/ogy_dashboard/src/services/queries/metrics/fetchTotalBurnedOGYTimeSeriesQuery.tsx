import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import { ChartData } from "@services/types/charts.types";
import {
  fetchSupplyHistory,
  toSupplySeries,
} from "@services/queries/metrics/supplyHistory";

export interface TotalBurnedOGYTimeSeriesParams {
  options?: UseQueryOptions<TotalBurnedOGYTimeSeries>;
  period: string;
}

export interface TotalBurnedOGYTimeSeries {
  totalBurnedOGYTimeSeries: ChartData[];
}

const fn = async ({
  period,
}: TotalBurnedOGYTimeSeriesParams): Promise<TotalBurnedOGYTimeSeries> => {
  const { items, config } = await fetchSupplyHistory(period);
  return {
    totalBurnedOGYTimeSeries: toSupplySeries(items, "total_burned", config),
  };
};

const fetchTotalBurnedOGYTimeSeriesQuery = ({
  options,
  period = "montlhy",
}: TotalBurnedOGYTimeSeriesParams) => {
  return {
    queryKey: ["fetchTotalBurnedOGYTimeSeries", period],
    queryFn: async () => fn({ period }),
    placeholderData: keepPreviousData,
    ...options,
  } as FetchQueryOptions<TotalBurnedOGYTimeSeries>;
};

export default fetchTotalBurnedOGYTimeSeriesQuery;
