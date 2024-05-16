import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import fetchTokenHolders from "@services/queries/metrics/fetchTokenHolders";

const useTokenDistribution = ({
  limit = 10,
  offset = 0,
}: {
  limit: number;
  offset: number;
}) => {
  const [tokenMetricsActor] = useCanister("tokenMetrics");
  const {
    data: tokenDistribution,
    isSuccess: isSuccessFetchTokenHolders,
    isError: isErrorFetchTokenHolders,
    isLoading: isLoadingFetchTokenHolders,
    error: errorFetchTokenHolders,
  } = useQuery({
    queryKey: ["listTokenDistribution", limit, offset],
    queryFn: () =>
      fetchTokenHolders({
        actor: tokenMetricsActor,
        limit,
        offset,
      }),
    placeholderData: keepPreviousData,
  });

  const isSuccess = isSuccessFetchTokenHolders;

  const rows = isSuccess
    ? tokenDistribution?.map((td) => {
        const principal = td.principal;
        const total = td.string.total;
        const governanceBalance = td.string.governanceBalance;
        const ledgerBalance = td.string.ledgerBalance;
        return {
          principal,
          total,
          governanceBalance,
          ledgerBalance,
        };
      })
    : [];

  return {
    data: {
      list: {
        rows,
        pageCount: 0,
        rowCount: 0,
      },
    },
    isLoading: isLoadingFetchTokenHolders,
    isSuccess,
    isError: isErrorFetchTokenHolders,
    error: errorFetchTokenHolders,
  };
};

export default useTokenDistribution;
