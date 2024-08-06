import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import _isNumeric from "validator/lib/isNumeric";

import {
  getAccountOverview,
  getPrincipalOverview,
} from "@hooks/super_stats_v3/queries";
import { fetchOneTransaction as fetchOneTransactionRosetta } from "@hooks/rosetta-api/queries";
import { fetchOneTransaction } from "@services/queries/transactions/fetchOneTransaction";

export const useSearchExplorer = ({ searchterm }: { searchterm: string }) => {
  const [data, setData] = useState<string | null>(null);
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
      return [resultsAccountOverview, resultsPrincipalOverview];
    } else {
      const resultsRosettaApi = await fetchOneTransactionRosetta({
        transactionId: searchterm,
      });
      const resultsLedgerApi = await fetchOneTransaction({
        transactionId: searchterm,
      });
      return [resultsRosettaApi, resultsLedgerApi];
    }
  };

  const results = useQuery({
    queryKey: ["GET_SEARCH", searchterm],
    queryFn: async () => fetchSearch(),
    enabled: !!searchterm,
    retry: false,
  });

  useEffect(() => {
    if (results.isSuccess) {
      if (results.data.some((r) => r && (r !== null || r !== undefined))) {
        setData(searchterm);
      } else {
        setData("");
      }
    }
  }, [results.isSuccess, results.data, searchterm]);

  return {
    isLoading: results.isLoading || !data,
    isSuccess: results.isSuccess && data !== null,
    isError: results.isError,
    error: results.error,
    data,
  };
};
