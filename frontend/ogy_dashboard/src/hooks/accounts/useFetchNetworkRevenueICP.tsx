import { useQuery, keepPreviousData } from "@tanstack/react-query";
import fetchNetworkRevenueICP from "@services/queries/accounts/fetchNetworkRevenueICP";

const useFetchNetworkRevenueICP = () => {
  return useQuery({
    queryKey: ["fetchNetworkRevenueICP"],
    queryFn: () => fetchNetworkRevenueICP(),
    placeholderData: keepPreviousData,
  });
};

export default useFetchNetworkRevenueICP;
