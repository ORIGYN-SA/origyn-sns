import { useQuery } from "@tanstack/react-query";
import { divideBy1e8, fetchSupplySummary } from "../services/gldtSupplyHistory";
import { gldtEndpoints } from "../services/gldt";

const fetchMarketCap = async () => {
  const summary = await fetchSupplySummary();
  const circulatingSupply = divideBy1e8(summary.circulating_supply);

  const priceHistory = await gldtEndpoints.getPriceHistory();
  const latest = priceHistory[priceHistory.length - 1];
  if (!latest) throw new Error("Failed to fetch OGY price");

  const marketCap = circulatingSupply * latest.price;
  return { marketCap, circulatingSupply, price: latest.price };
};

export const useMarketCap = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["marketCap"],
    queryFn: fetchMarketCap,
  });
  return { data, loading: isLoading, error: error?.message ?? null };
};
