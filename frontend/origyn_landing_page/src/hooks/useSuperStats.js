import { useQuery } from "@tanstack/react-query";
import { gldtClient, gldtTokenPath } from "../services/gldt";

const PRE_SNS_ACCOUNTS = 26000;

const fetchSuperStats = async () => {
  const { data } = await gldtClient.get(gldtTokenPath("activity", { days: 2 }));
  const latest = data[data.length - 1];
  return {
    users: Number(latest?.total_unique_accounts ?? 0) + PRE_SNS_ACCOUNTS,
  };
};

export const useSuperStats = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["superStats"],
    queryFn: fetchSuperStats,
  });
  return { data, loading: isLoading, error: error?.message ?? null };
};
