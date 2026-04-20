import { useQuery } from "@tanstack/react-query";
import { Actor } from "@dfinity/agent";
import { idlFactory } from "../services/candid/super_stats";
import { agent } from "../services/icpAgent";

const PRE_SNS_ACCOUNTS = 26000;

const fetchSuperStats = async () => {
  const canisterId = import.meta.env.VITE_SUPER_STATS_CANISTER_ID;
  const actor = Actor.createActor(idlFactory, { agent, canisterId });
  const stats = await actor.get_activity_stats(2);
  return { users: parseInt(stats?.pop()?.total_unique_accounts) + PRE_SNS_ACCOUNTS };
};

export const useSuperStats = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["superStats"],
    queryFn: fetchSuperStats,
  });
  return { data, loading: isLoading, error: error?.message ?? null };
};
