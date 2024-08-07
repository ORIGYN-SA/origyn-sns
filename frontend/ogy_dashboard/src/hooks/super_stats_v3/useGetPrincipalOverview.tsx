import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import { Overview } from "./declarations";

import { getPrincipalOverview } from "./queries";

const useGetPrincipalOverview = ({ principalId }: { principalId: string }) => {
  const {
    data,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<Overview | null> = useQuery({
    queryFn: () => getPrincipalOverview({ principalId }),
    placeholderData: keepPreviousData,
    queryKey: ["SUPER_STATS_GET_PRINCIPAL_OVERVIEW", principalId],
  });

  return {
    data,
    isSuccess,
    isError,
    isLoading,
    error,
  };
};

export default useGetPrincipalOverview;
