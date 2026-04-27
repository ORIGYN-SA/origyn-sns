import { useQuery } from "@tanstack/react-query";

const fetchMarketCap = async () => {
  const supplyResponse = await fetch(
    `https://${import.meta.env.VITE_TOKEN_METRICS_CANISTER_ID}.raw.icp0.io/circulating-supply`
  );
  if (!supplyResponse.ok) throw new Error("Failed to fetch circulating supply");
  const circulatingSupply = await supplyResponse.json();

  const priceResponse = await fetch("https://api.origyn.com/ogy/price");
  if (!priceResponse.ok) throw new Error("Failed to fetch OGY price");
  const priceData = await priceResponse.json();

  const marketCap = parseInt(circulatingSupply) * priceData.ogyPrice;
  return { marketCap, circulatingSupply, price: priceData.ogyPrice };
};

export const useMarketCap = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["marketCap"],
    queryFn: fetchMarketCap,
  });
  return { data, loading: isLoading, error: error?.message ?? null };
};
