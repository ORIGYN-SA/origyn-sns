import { useState, useEffect } from "react";
import { PricingData } from "../../types/pricing";

export const usePricingData = () => {
  const [data, setData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_B2B_CANISTER_API_URL}pricing`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch pricing data");
        }
        const data = await response.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPricingData();
  }, []);

  return { data, loading, error };
};
