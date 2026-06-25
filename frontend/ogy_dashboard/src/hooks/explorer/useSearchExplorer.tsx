import { useQuery } from "@tanstack/react-query";

import { getPrincipalOverview } from "@hooks/super_stats_v3/queries";
import { fetchOneTransaction } from "@services/queries/transactions/fetchOneTransaction";

export const useSearchExplorer = ({ searchterm }: { searchterm: string }) => {
  const fetchSearch = async () => {
    const isBlockIndexSearch = /^\d+$/.test(searchterm);
    if (!isBlockIndexSearch) {
      const overview = await getPrincipalOverview({ principalId: searchterm });
      if (overview) {
        return { type: "principalId", value: searchterm };
      }
      return null;
    } else {
      try {
        await fetchOneTransaction({ transactionId: searchterm });
        return { type: "blockIndex", value: searchterm };
      } catch {
        return null;
      }
    }
  };

  const results = useQuery({
    queryKey: ["GET_SEARCH", searchterm],
    queryFn: async () => fetchSearch(),
    enabled: !!searchterm,
    retry: false,
  });

  return {
    isLoading: results.isLoading,
    isSuccess: results.isSuccess,
    isError: results.isError,
    error: results.error,
    data: results.data as { type: "blockIndex" | "principalId"; value: string },
  };
};
