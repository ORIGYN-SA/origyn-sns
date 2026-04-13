import { useQuery, UseQueryResult } from "@tanstack/react-query";
import fetchTotalSupplyOGY, {
  TotalSupplyOGY,
} from "@services/queries/metrics/fetchTotalSupplyOGYQuery";
import fetchTotalSupplyOGYTimeSeries, {
  TotalSupplyOGYTimeSeries,
} from "@services/queries/metrics/fetchTotalSupplyOGYTimeSeriesQuery";

const useTotalOGYSupply = ({ period }: { period: string }) => {
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
    fetchTotalSupplyOGYTimeSeries({ period })
  );

  return {
    data: {
      totalSupply: dataTotalSupply?.totalSupplyOGYToString ?? "0",
      dataPieChart: dataTotalSupplyTimeSeries?.totalSupplyOGYTimeSeries ?? [],
    },
    isSuccess:
      isSuccessFetchTotalSupply && isSuccessFetchTotalSupplyTimeSeries,
    isLoading:
      isLoadingFetchTotalSupply || isLoadingFetchTotalSupplyTimeSeries,
    error: errorFetchTotalSupply || errorTotalSupplyTimeSeries,
  };
};

export default useTotalOGYSupply;
