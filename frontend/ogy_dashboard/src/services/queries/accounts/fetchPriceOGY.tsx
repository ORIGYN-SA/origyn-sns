import { keepPreviousData } from "@tanstack/react-query";
import ogyAPI from "@services/api/ogy";

export const fetchPriceOGY = async () => {
  const { data: dataOGYPrice } = await ogyAPI.get(`/price`);
  const { ogyPrice } = dataOGYPrice;

  return {
    ogyPrice,
  };
};

const useFetchPriceOGY = ({ enabled = true }: { enabled?: boolean }) => {
  return {
    queryKey: ["fetchPriceOGY"],
    queryFn: () => fetchPriceOGY(),
    placeholderData: keepPreviousData,
    enabled: !!enabled,
    refetchOnWindowFocus: !!enabled,
  };
};

export default useFetchPriceOGY;
