import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import icrcAPI from "@services/_api/icrc/v1";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";
import { transformTimeSeriesToBarChartData } from "@helpers/charts/index";
import { ChartData } from "@services/_api/types/charts.types";

export interface TotalSupplyOGYTimeSeriesParams {
  options?: UseQueryOptions;
  start?: string | null; // in timestamp
  end?: string | null; // in timestamp
  step?: string | null; // in seconds
}

export interface TotalSupplyOGYTimeSeries {
  totalSupplyOGYTimeSeries: ChartData[];
}

const fn = async ({
  start,
  end,
  step,
}: TotalSupplyOGYTimeSeriesParams): Promise<TotalSupplyOGYTimeSeries> => {
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/total-supply?${
      start ? `start=${start}` : ``
    }${end ? `&end=${end}` : ``}${step ? `&step=${step}` : ``}`
  );
  return {
    totalSupplyOGYTimeSeries:
      transformTimeSeriesToBarChartData(data.data) ?? null,
  };
};

const fetchTotalSupplyOGYTimeSeriesQuery = ({
  options,
  start = null,
  end = null,
  step = null,
}: TotalSupplyOGYTimeSeriesParams) => {
  return {
    queryKey: ["fetchTotalSupplyOGYTimeSeries", start, end, step],
    queryFn: async () => fn({ start, end, step }),
    placeholderData: keepPreviousData,
    ...options,
  } as FetchQueryOptions;
};

export default fetchTotalSupplyOGYTimeSeriesQuery;
