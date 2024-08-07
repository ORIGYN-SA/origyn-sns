import { useQuery } from "@tanstack/react-query";
import _isNumeric from "validator/lib/isNumeric";

import {
  getAccountOverview,
  getPrincipalOverview,
} from "@hooks/super_stats_v3/queries";
import { fetchOneTransaction as fetchOneTransactionRosetta } from "@hooks/rosetta-api/queries";
import { fetchOneTransaction } from "@services/queries/transactions/fetchOneTransaction";

export const useSearchExplorer = ({ searchterm }: { searchterm: string }) => {
  const fetchSearch = async () => {
    const isSearchtermNumber = () =>
      _isNumeric(searchterm, { no_symbols: true });
    if (!isSearchtermNumber()) {
      const resultsAccountOverview = await getAccountOverview({
        accountId: searchterm,
      });
      const resultsPrincipalOverview = await getPrincipalOverview({
        principalId: searchterm,
      });
      if (resultsAccountOverview || resultsPrincipalOverview) {
        return { type: "principalId", value: searchterm };
      }
      return null;
    } else {
      const resultsRosettaApi = await fetchOneTransactionRosetta({
        transactionId: searchterm,
      });
      const resultsLedgerApi = await fetchOneTransaction({
        transactionId: searchterm,
      });
      if (resultsRosettaApi || resultsLedgerApi) {
        return { type: "blockIndex", value: searchterm };
      }
      return null;
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
