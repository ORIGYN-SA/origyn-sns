import { useQuery, keepPreviousData } from "@tanstack/react-query";
import fetchNftTransactions, {
  FetchNftTransactionsParams,
} from "@services/queries/nft/fetchNftTransactions";

const ONE_MINUTE = 60 * 1000;

const useNftTransactions = (params: FetchNftTransactionsParams = {}) => {
  const query = useQuery({
    queryKey: ["NFT_TRANSACTIONS", params],
    queryFn: () => fetchNftTransactions(params),
    placeholderData: keepPreviousData,
    staleTime: ONE_MINUTE,
  });

  return {
    ...query,
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
  };
};

export default useNftTransactions;
