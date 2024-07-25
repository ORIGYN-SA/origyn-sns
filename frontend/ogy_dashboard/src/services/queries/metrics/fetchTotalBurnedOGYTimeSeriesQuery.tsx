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
import { getCurrentDateInSeconds } from "@helpers/dates/index";

export interface TotalBurnedOGYTimeSeriesParams {
  options?: UseQueryOptions;
  period: string;
}

export interface TotalBurnedOGYTimeSeries {
  totalBurnedOGYTimeSeries: ChartData[];
}

const fn = async ({
  period,
}: TotalBurnedOGYTimeSeriesParams): Promise<TotalBurnedOGYTimeSeries> => {
  const p = timeseriesPeriodOptions(period);
  const TIMESTAMP_REFERENCE_LAUNCH_SNS = 1717545600;
  const { data } = await icrcAPI.get(
    `/ledgers/${SNS_LEDGER_CANISTER_ID}/total-burned-per-day?start=${TIMESTAMP_REFERENCE_LAUNCH_SNS}&end=${getCurrentDateInSeconds()}`
  );
  const _data = transformTimeSeriesToBarChartData(data.data) ?? null;
  const cumulativeData = _data.reduce(
    (
      accumulator: Array<{ name: string; value: number }>,
      current: { name: string; value: number },
      index
    ) => {
      const previousValue = index === 0 ? 0 : accumulator[index - 1].value;
      const cumulativeValue = previousValue + current.value;
      accumulator.push({ name: current.name, value: cumulativeValue });
      return accumulator;
    },
    []
  );

  return {
    totalBurnedOGYTimeSeries: cumulativeData.slice(-p.days) ?? null,
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
  } as FetchQueryOptions;
};

export default fetchTotalBurnedOGYTimeSeriesQuery;
