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

export interface TotalSupplyOGYTimeSeriesParams {
  options?: UseQueryOptions<TotalSupplyOGYTimeSeries>;
  period: string;
}

export interface TotalSupplyOGYTimeSeries {
  totalSupplyOGYTimeSeries: ChartData[];
}

const fn = async ({
  period,
}: TotalSupplyOGYTimeSeriesParams): Promise<TotalSupplyOGYTimeSeries> => {
  const { items, config } = await fetchSupplyHistory(period);
  return {
    totalSupplyOGYTimeSeries: toSupplySeries(items, "total_supply", config),
  };
};

const fetchTotalSupplyOGYTimeSeriesQuery = ({
  options,
  period,
}: TotalSupplyOGYTimeSeriesParams) => {
  return {
    queryKey: ["fetchTotalSupplyOGYTimeSeries", period],
    queryFn: async () => fn({ period }),
    placeholderData: keepPreviousData,
    ...options,
  } as FetchQueryOptions<TotalSupplyOGYTimeSeries>;
};

export default fetchTotalSupplyOGYTimeSeriesQuery;
