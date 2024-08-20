import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import fetchTokenHolders from "@services/queries/metrics/fetchTokenHolders";
import fetchTotalSupplyOGY, {
  TotalSupplyOGY,
} from "@services/queries/metrics/fetchTotalSupplyOGYQuery";
import { ORIGYN_ACCOUNTS } from "@constants/index";

const useTokenDistribution = ({
  limit = 10,
  offset = 0,
}: {
  limit: number;
  offset: number;
}) => {
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
        limit,
        offset,
      }),
    placeholderData: keepPreviousData,
  });

  const {
    data: dataTotalSupply,
    isSuccess: isSuccessFetchTotalSupply,
    isLoading: isLoadingFetchTotalSupply,
    isError: isErrorFetchTotalSupply,
    error: errorFetchTotalSupply,
  }: UseQueryResult<TotalSupplyOGY> = useQuery(fetchTotalSupplyOGY({}));

  const isSuccess = isSuccessFetchTokenHolders && isSuccessFetchTotalSupply;

  const rows = isSuccess
    ? tokenDistribution.data.map((td) => {
        const principal = td.principal;
        const tag = ORIGYN_ACCOUNTS.find((e) => e.value === td.principal)?.name;
        const total = td.string.total;
        const governanceBalance = td.string.governanceBalance;
        const ledgerBalance = td.string.ledgerBalance;
        const weight = (
          dataTotalSupply.totalSupplyOGY > 0
            ? (td.total / dataTotalSupply.totalSupplyOGY) * 100
            : 0
        ).toFixed(2);
        return {
          principal,
          tag,
          total,
          governanceBalance,
          ledgerBalance,
          weight: `${weight} %`,
        };
      })
    : [];

  return {
    data: {
      list: {
        rows,
        pageCount: tokenDistribution?.totalHolders
          ? Math.ceil(tokenDistribution?.totalHolders / limit)
          : 0,
        rowCount: tokenDistribution?.totalHolders ?? 0,
      },
    },
    isLoading: isLoadingFetchTokenHolders || isLoadingFetchTotalSupply,
    isSuccess,
    isError: isErrorFetchTokenHolders || isErrorFetchTotalSupply,
    error: errorFetchTokenHolders || errorFetchTotalSupply,
  };
};

export default useTokenDistribution;
