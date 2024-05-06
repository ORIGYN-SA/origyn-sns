import { useState, useEffect } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import fetchTotalBurnedOGY, {
  TotalBurnedOGY,
} from "@services/metrics/fetchTotalBurnedOGYQuery";
import fetchTotalBurnedOGYTimeSeries, {
  TotalBurnedOGYTimeSeries,
} from "@services/metrics/fetchTotalBurnedOGYTimeSeriesQuery";
import { ChartData } from "@services/_api/types/charts.types";
import {
  getCurrentDateInSeconds,
  getCurrentDateLastWeekInSeconds,
} from "@helpers/dates/index";

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
      start: getCurrentDateLastWeekInSeconds(),
      end: getCurrentDateInSeconds(),
      step: "86400",
    })
  );

  useEffect(() => {
    if (isSuccessFetchTotalBurned && isSuccessFetchTotalBurnedTimeSeries) {
      setData({
        totalBurned: dataTotalBurned.totalBurnedOGYToString,
        dataPieChart: dataTotalBurnedTimeSeries.totalBurnedOGYTimeSeries,
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
