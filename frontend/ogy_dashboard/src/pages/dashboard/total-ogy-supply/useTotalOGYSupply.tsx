import { useState, useEffect } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import fetchTotalSupplyOGY, {
  TotalSupplyOGY,
} from "@services/metrics/fetchTotalSupplyOGYQuery";
import fetchTotalSupplyOGYTimeSeries, {
  TotalSupplyOGYTimeSeries,
} from "@services/metrics/fetchTotalSupplyOGYTimeSeriesQuery";
import { ChartData } from "@services/_api/types/charts.types";
import {
  getCurrentDateInSeconds,
  getCurrentDateLastWeekInSeconds,
} from "@helpers/dates/index";

const useTotalOGYSupply = () => {
  const [data, setData] = useState({
    totalSupply: "0",
    dataPieChart: [] as ChartData[],
  });

  const {
    data: dataTotalSupply,
    isSuccess: isSuccessFetchTotalSupply,
    isLoading: isLoadingFetchTotalSupply,
    error: errorFetchTotalSupply,
  }: UseQueryResult<TotalSupplyOGY> = useQuery(fetchTotalSupplyOGY({}));

  const {
    data: dataTotalSupplyTimeSeries,
    isSuccess: isSuccessFetchTotalSupplyTimeSeries,
    isLoading: isLoadingFetchTotalSupplyTimeSeries,
    error: errorTotalSupplyTimeSeries,
  }: UseQueryResult<TotalSupplyOGYTimeSeries> = useQuery(
    fetchTotalSupplyOGYTimeSeries({
      start: getCurrentDateLastWeekInSeconds(),
      end: getCurrentDateInSeconds(),
      step: "86400",
    })
  );

  useEffect(() => {
    if (isSuccessFetchTotalSupply && isSuccessFetchTotalSupplyTimeSeries) {
      setData({
        totalSupply: dataTotalSupply.totalSupplyOGYToString,
        dataPieChart: dataTotalSupplyTimeSeries.totalSupplyOGYTimeSeries,
      });
    }
  }, [
    isSuccessFetchTotalSupply,
    isSuccessFetchTotalSupplyTimeSeries,
    dataTotalSupply,
    dataTotalSupplyTimeSeries,
  ]);

  const isSuccess =
    isSuccessFetchTotalSupply && isSuccessFetchTotalSupplyTimeSeries;
  const isLoading =
    isLoadingFetchTotalSupply || isLoadingFetchTotalSupplyTimeSeries;
  const error = errorFetchTotalSupply || errorTotalSupplyTimeSeries;

  return { data, isSuccess, isLoading, error };
};

export default useTotalOGYSupply;
