import {
  UseQueryOptions,
  FetchQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import icrcAPI from "@services/_api/icrc/v1";
import { SNS_LEDGER_CANISTER_ID } from "@constants/index";
import { transformTimeSeriesToBarChartData } from "@helpers/charts/index";
import { ChartData } from "@services/_api/types/charts.types";

export interface TotalBurnedOGYTimeSeriesParams {
  options?: UseQueryOptions;
  start?: string | null; // in timestamp
  end?: string | null; // in timestamp
  step?: string | null; // in seconds
}

export interface TotalBurnedOGYTimeSeries {
  totalBurnedOGYTimeSeries: ChartData[];
}

const fn = async ({
  start,
  end,
  step,
}: TotalBurnedOGYTimeSeriesParams): Promise<TotalBurnedOGYTimeSeries> => {
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/total-burned-per-day?${
      start ? `start=${start}` : ``
    }${end ? `&end=${end}` : ``}${step ? `&step=${step}` : ``}`
  );
  return {
    totalBurnedOGYTimeSeries:
      transformTimeSeriesToBarChartData(data.data) ?? null,
  };
};

const fetchTotalBurnedOGYTimeSeriesQuery = ({
  options,
  start = null,
  end = null,
  step = null,
}: TotalBurnedOGYTimeSeriesParams) => {
  return {
    queryKey: ["fetchTotalBurnedOGYTimeSeries", start, end, step],
    queryFn: async () => fn({ start, end, step }),
    placeholderData: keepPreviousData,
    ...options,
  } as FetchQueryOptions;
};

export default fetchTotalBurnedOGYTimeSeriesQuery;
