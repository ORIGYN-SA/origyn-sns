import { useQuery } from "@tanstack/react-query";
import { divideBy1e8, fetchSupplySummary } from "../services/gldtSupplyHistory";

const fetchMarketCap = async () => {
  const summary = await fetchSupplySummary();
  const circulatingSupply = divideBy1e8(summary.circulating_supply);

  const priceResponse = await fetch("https://api.origyn.com/ogy/price");
  if (!priceResponse.ok) throw new Error("Failed to fetch OGY price");
  const priceData = await priceResponse.json();

  const marketCap = circulatingSupply * priceData.ogyPrice;
  return { marketCap, circulatingSupply, price: priceData.ogyPrice };
};

export const useMarketCap = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["marketCap"],
    queryFn: fetchMarketCap,
  });
  return { data, loading: isLoading, error: error?.message ?? null };
};
