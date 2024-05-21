import { useQuery, keepPreviousData } from "@tanstack/react-query";
import fetchBalanceICP from "@services/queries/accounts/fetchBalanceICP";

const useFetchBalanceICP = () => {
  return useQuery({
    queryKey: ["fetchBalanceICP"],
    queryFn: () => fetchBalanceICP(),
    placeholderData: keepPreviousData,
  });
};

export default useFetchBalanceICP;
