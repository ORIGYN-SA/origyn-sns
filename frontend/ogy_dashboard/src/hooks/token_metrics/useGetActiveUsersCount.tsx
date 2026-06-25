import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import { ActiveUsers } from "./declarations_files/token_metrics";
import fetchActiveUsersCount from "@services/queries/metrics/fetchActiveUsersCount";

const useGetActiveUsersCount = () => {
  const {
    data,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<ActiveUsers> = useQuery({
    queryFn: fetchActiveUsersCount,
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
