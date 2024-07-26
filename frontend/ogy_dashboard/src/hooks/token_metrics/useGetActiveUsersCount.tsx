import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import { ActiveUsers } from "./declarations_files/token_metrics";

import { getActor } from "@amerej/artemis-react";

const useGetActiveUsersCount = () => {
  const {
    data,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<ActiveUsers> = useQuery({
    queryFn: async (): Promise<ActiveUsers> => {
      const actor = await getActor("tokenMetrics", { isAnon: true });
      const results = await actor.get_active_users_count();
      return results as ActiveUsers;
    },
    placeholderData: keepPreviousData,
    queryKey: ["GET_ACTIVE_USERS_COUNT"],
  });

  return {
    data,
    isSuccess,
    isError,
    isLoading,
    error,
  };
};

export default useGetActiveUsersCount;
