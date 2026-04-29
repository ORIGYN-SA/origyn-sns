import { useQuery } from "@tanstack/react-query";

const fetchPricingData = async () => {
  const response = await fetch(`${import.meta.env.VITE_B2B_CANISTER_API_URL}pricing`);
  if (!response.ok) throw new Error("Failed to fetch pricing data");
  return response.json();
};

export const usePricingData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["pricingData"],
    queryFn: fetchPricingData,
  });
  return { data, loading: isLoading, error: error?.message ?? null };
};
