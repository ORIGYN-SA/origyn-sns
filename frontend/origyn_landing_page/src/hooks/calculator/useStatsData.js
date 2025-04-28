import { useState, useEffect } from "react";
import { useSuperStats } from "./useSuperStats";
import { useMarketCap } from "./useMarketCap";

export const useStatsData = () => {
  const [data, setData] = useState({
    tvl: undefined,
    users: undefined,
    marketCap: undefined,
    price: undefined,
    circulatingSupply: undefined,
    assets: 3065,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    data: superStats,
    loading: superStatsLoading,
    error: superStatsError,
  } = useSuperStats();

  const {
    data: marketCapData,
    loading: marketCapLoading,
    error: marketCapError,
  } = useMarketCap();

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const tvlResponse = await fetch(
          `https://${
            import.meta.env.VITE_COLLECTION_INDEXER_CANISTER_ID
          }.raw.icp0.io/stats`
        );
        if (!tvlResponse.ok) {
          throw new Error("Failed to fetch TVL data");
        }
        const tvlData = await tvlResponse.json();

        // Update data with available values, keeping existing values if new ones aren't available
        setData((prevData) => ({
          ...prevData,
          tvl: tvlData.total_value_locked?.toLocaleString(),
          users: superStats?.users
            ? superStats.users.toLocaleString()
            : prevData.users,
          marketCap: marketCapData?.marketCap
            ? parseInt(marketCapData?.marketCap)?.toLocaleString()
            : prevData.marketCap,
          price: marketCapData?.price
            ? `$${marketCapData.price?.toLocaleString()}`
            : prevData.price,
          circulatingSupply: marketCapData?.circulatingSupply?.toLocaleString(),
          assets: prevData.assets.toLocaleString(),
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    // Fetch data as soon as possible, don't wait for other sources
    fetchStatsData();
  }, [superStats, marketCapData]);

  // Only consider loading if all sources are loading
  const isLoading = loading && superStatsLoading && marketCapLoading;
  // Collect all errors
  const errors = [];
  if (error) errors.push(error);
  if (superStatsError) errors.push(superStatsError);
  if (marketCapError) errors.push(marketCapError);
  const combinedError = errors.length > 0 ? errors.join("; ") : null;

  return { data, loading: isLoading, error: combinedError };
};
