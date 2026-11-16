import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";

import { GLDT_API_BASE_URL } from "@constants";
import { roundAndFormatLocale } from "@utils/numbers/index";

interface PriceHistoryItem {
  date: string;
  price: number;
}

// One USD price per day, oldest first. The last row is today's.
const fetchOGYPrice = async () => {
  const { data } = await axios.get<PriceHistoryItem[]>(
    `${GLDT_API_BASE_URL}/v1/tokens/OGY/price/history`,
    { params: { group: "day" } }
  );
  const latest = data[data.length - 1];
  if (!latest) throw new Error("api.gldt.org returned no OGY price");

  return {
    ogyPrice: latest.price,
  };
};

export const useBalanceOGYUSD = ({
  balance,
}: {
  balance: number | undefined | null;
}) => {
  const [balanceUSD, setBalanceUSD] = useState<string | null | undefined>(null);

  const { data, isSuccess, isLoading, isError, error } = useQuery({
    queryKey: ["FETCH_OGY_PRICE"],
    queryFn: () => fetchOGYPrice(),
    placeholderData: keepPreviousData,
    enabled: balance !== undefined && balance !== null,
  });

  useEffect(() => {
    if (isSuccess && balance !== undefined && balance !== null) {
      setBalanceUSD(roundAndFormatLocale({ number: balance * data.ogyPrice }));
    }
  }, [isSuccess, data, balance]);

  return {
    data: balanceUSD,
    isSuccess,
    isLoading,
    isError,
    error,
  };
};
