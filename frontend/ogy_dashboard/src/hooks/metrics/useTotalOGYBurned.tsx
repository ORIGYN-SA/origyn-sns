import { useMemo } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import fetchTotalBurnedOGY, {
  TotalBurnedOGY,
} from "@services/queries/metrics/fetchTotalBurnedOGYQuery";
import fetchTotalBurnedOGYTimeSeries, {
  TotalBurnedOGYTimeSeries,
} from "@services/queries/metrics/fetchTotalBurnedOGYTimeSeriesQuery";
import { ChartData } from "@services/types/charts.types";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";

// OGY tokens burned before the on-chain tracking started (legacy ledger era).
// Added to both the total and each time-series point so the chart reflects
// the true cumulative burn from genesis.
const BURN_OFFSET = 202420405.1;

const useTotalOGYBurned = ({ period }: { period: string }) => {
  const {
    data: dataTotalBurned,
    isSuccess: isSuccessFetchTotalBurned,
    isLoading: isLoadingFetchTotalBurned,
    error: errorFetchTotalBurned,
  }: UseQueryResult<TotalBurnedOGY> = useQuery(fetchTotalBurnedOGY({}));

  const {
    data: dataTotalBurnedTimeSeries,
    isSuccess: isSuccessFetchTotalBurnedTimeSeries,
    isLoading: isLoadingFetchTotalBurnedTimeSeries,
    error: errorTotalBurnedTimeSeries,
  }: UseQueryResult<TotalBurnedOGYTimeSeries> = useQuery(
    fetchTotalBurnedOGYTimeSeries({ period })
  );

  const data = useMemo(
    () => ({
      totalBurned: dataTotalBurned
        ? roundAndFormatLocale({
            number: divideBy1e8(dataTotalBurned.totalBurnedOGY) + BURN_OFFSET,
          })
        : undefined,
      dataPieChart: dataTotalBurnedTimeSeries?.totalBurnedOGYTimeSeries?.map(
        (d: ChartData) => ({
          value: d.value + BURN_OFFSET,
          name: d.name,
        })
      ),
    }),
    [dataTotalBurned, dataTotalBurnedTimeSeries]
  );

  return {
    data,
    isSuccess: isSuccessFetchTotalBurned && isSuccessFetchTotalBurnedTimeSeries,
    isLoading: isLoadingFetchTotalBurned || isLoadingFetchTotalBurnedTimeSeries,
    error: errorFetchTotalBurned || errorTotalBurnedTimeSeries,
  };
};

export default useTotalOGYBurned;
