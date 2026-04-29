import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import { OverviewResponse as Overview } from "@hooks/token_metrics/declarations_files/token_metrics";

import { getAccountOverview } from "./queries";

const useGetAccountOverview = ({ accountId }: { accountId: string }) => {
  const {
    data,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<Overview | null> = useQuery({
    queryFn: () => getAccountOverview({ accountId }),
    placeholderData: keepPreviousData,
    queryKey: ["SUPER_STATS_GET_ACCOUNT_OVERVIEW", accountId],
  });

  return {
    data,
    isSuccess,
    isError,
    isLoading,
    error,
  };
};

export default useGetAccountOverview;
