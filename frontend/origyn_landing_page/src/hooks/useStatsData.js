import { useQuery } from "@tanstack/react-query";
import useCirculationStateOGY from "./useCirculationStateOGY";
import useFoundationReserve from "./useFoundationReserve";
import { useSuperStats } from "./useSuperStats";
import { useMarketCap } from "./useMarketCap";
import useTotalOGYBurned from "./useTotalOGYBurned";

const fetchTvl = async () => {
  const response = await fetch(
    `https://${import.meta.env.VITE_COLLECTION_INDEXER_CANISTER_ID}.raw.icp0.io/stats`
  );
  if (!response.ok) throw new Error("Failed to fetch TVL data");
  return response.json();
};

const fmt = (n) => n?.toLocaleString("en-US").replace(/,/g, " ");

export const useStatsData = () => {
  const { data: superStats, loading: superStatsLoading, error: superStatsError } = useSuperStats();
  const { data: marketCapData, loading: marketCapLoading, error: marketCapError } = useMarketCap();
  const { data: tokenData, loading: tokenDataLoading, error: tokenDataError } = useCirculationStateOGY();
  const { data: reserveData, loading: reserveDataLoading, error: reserveDataError } = useFoundationReserve();
  const { data: totalBurnedData, loading: totalBurnedLoading, error: totalBurnedError } = useTotalOGYBurned();
  const { data: tvlData, isLoading: tvlLoading, error: tvlError } = useQuery({
    queryKey: ["tvl"],
    queryFn: fetchTvl,
  });

  const data = {
    tvl: tvlData?.total_value_locked != null ? `$${fmt(tvlData.total_value_locked)}` : undefined,
    users: superStats?.users != null ? fmt(superStats.users) : undefined,
    marketCap: marketCapData?.marketCap != null
      ? `$${fmt(parseInt(marketCapData.marketCap))}`
      : undefined,
    price: marketCapData?.price != null ? `$${fmt(marketCapData.price)}` : undefined,
    circulatingSupply: marketCapData?.circulatingSupply != null
      ? fmt(marketCapData.circulatingSupply)
      : undefined,
    totalBurned: totalBurnedData?.totalBurnedOGY != null
      ? fmt(totalBurnedData.totalBurnedOGY)
      : undefined,
    assets: fmt(3065),
    totalHolders: tokenData?.number !== null ? fmt(tokenData?.number?.totalHolders) : undefined,
    tokenSupply: reserveData?.number != null ? fmt(reserveData?.number?.totalSupply) : undefined
  };

  const isLoading = superStatsLoading || marketCapLoading || tvlLoading || tokenDataLoading || reserveDataLoading || totalBurnedLoading;
  const errors = [superStatsError, marketCapError, tvlError?.message, tokenDataError?.message, reserveDataError?.message, totalBurnedError].filter(Boolean);
  const combinedError = errors.length > 0 ? errors.join("; ") : null;

  return { data, loading: isLoading, error: combinedError };
};
