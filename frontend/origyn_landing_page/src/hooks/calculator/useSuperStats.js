import { useState, useEffect } from "react";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../services/candid/super_stats";

const agent = new HttpAgent({
  host: "https://icp-api.io",
});

const PRE_SNS_ACCOUNTS = 26000;

export const useSuperStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuperStats = async () => {
      try {
        const canisterId = import.meta.env.VITE_SUPER_STATS_CANISTER_ID;
        const actor = Actor.createActor(idlFactory, {
          agent,
          canisterId,
        });

        const stats = await actor.get_activity_stats(2);
        setData({
          users:
            parseInt(stats?.pop()?.total_unique_accounts) + PRE_SNS_ACCOUNTS,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSuperStats();
  }, []);

  return { data, loading, error };
};
