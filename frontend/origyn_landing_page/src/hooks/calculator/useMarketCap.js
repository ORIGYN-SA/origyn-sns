import { useState, useEffect } from "react";

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds delay between retries

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const useMarketCap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarketCap = async (retryCount = 0) => {
      try {
        const supplyResponse = await fetch(
          `https://${
            import.meta.env.VITE_TOKEN_METRICS_CANISTER_ID
          }.raw.icp0.io/circulating-supply`
        );
        if (!supplyResponse.ok) {
          throw new Error("Failed to fetch circulating supply");
        }
        const circulatingSupply = await supplyResponse.json();

        const priceResponse = await fetch("https://api.origyn.com/ogy/price");
        if (!priceResponse.ok) {
          throw new Error("Failed to fetch OGY price");
        }
        const priceData = await priceResponse.json();

        // Calculate market cap
        const marketCap = parseInt(circulatingSupply) * priceData.ogyPrice;

        setData({
          marketCap,
          circulatingSupply,
          price: priceData.ogyPrice,
        });
        setError(null);
      } catch (err) {
        if (retryCount < MAX_RETRIES) {
          await sleep(RETRY_DELAY);
          return fetchMarketCap(retryCount + 1);
        }
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (retryCount === MAX_RETRIES) {
          setLoading(false);
        }
      }
    };

    fetchMarketCap();
  }, []);

  return { data, loading, error };
};
