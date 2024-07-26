import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import icrcAPI from "@services/api/icrc/v1";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";
import {
  transformTimeSeriesToBarChartData,
  timeseriesPeriodOptions,
} from "@helpers/charts/index";
import { ChartData } from "@services/types/charts.types";

export interface TotalSupplyOGYTimeSeriesParams {
  options?: UseQueryOptions;
  period: string;
}

export interface TotalSupplyOGYTimeSeries {
  totalSupplyOGYTimeSeries: ChartData[];
}

const fn = async ({
  period,
}: TotalSupplyOGYTimeSeriesParams): Promise<TotalSupplyOGYTimeSeries> => {
  const p = timeseriesPeriodOptions(period);
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/total-supply?start=${p.start}&step=${p.step}`
  );
  return {
    totalSupplyOGYTimeSeries:
      transformTimeSeriesToBarChartData(data.data) ?? null,
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
  } as FetchQueryOptions;
};

export default fetchTotalSupplyOGYTimeSeriesQuery;
