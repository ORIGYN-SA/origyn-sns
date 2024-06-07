import { useState, useEffect } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import fetchTotalBurnedOGY, {
  TotalBurnedOGY,
} from "@services/queries/metrics/fetchTotalBurnedOGYQuery";
import fetchTotalBurnedOGYTimeSeries, {
  TotalBurnedOGYTimeSeries,
} from "@services/queries/metrics/fetchTotalBurnedOGYTimeSeriesQuery";
import { ChartData } from "@services/types/charts.types";
import {
  getCurrentDateInSeconds,
  // getCurrentDateLastWeekInSeconds,
  getCurrentDateLastMonthInSeconds,
} from "@helpers/dates/index";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";

const useTotalOGYBurned = () => {
  const [data, setData] = useState({
    totalBurned: "0",
    dataPieChart: [] as ChartData[],
  });

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
    fetchTotalBurnedOGYTimeSeries({
      start: getCurrentDateLastMonthInSeconds(),
      end: getCurrentDateInSeconds(),
      step: "86400",
    })
  );

  useEffect(() => {
    if (isSuccessFetchTotalBurned && isSuccessFetchTotalBurnedTimeSeries) {
      setData({
        totalBurned: roundAndFormatLocale({
          number: divideBy1e8(dataTotalBurned.totalBurnedOGY) + 202420405.1,
        }),
        dataPieChart: dataTotalBurnedTimeSeries.totalBurnedOGYTimeSeries.map(
          (d: ChartData) => {
            return { value: d.value + 202420405.1, name: d.name };
          }
        ) as ChartData[],
      });
    }
  }, [
    isSuccessFetchTotalBurned,
    isSuccessFetchTotalBurnedTimeSeries,
    dataTotalBurned,
    dataTotalBurnedTimeSeries,
  ]);

  const isSuccess =
    isSuccessFetchTotalBurned && isSuccessFetchTotalBurnedTimeSeries;
  const isLoading =
    isLoadingFetchTotalBurned || isLoadingFetchTotalBurnedTimeSeries;
  const error = errorFetchTotalBurned || errorTotalBurnedTimeSeries;

  return { data, isSuccess, isLoading, error };
};

export default useTotalOGYBurned;
