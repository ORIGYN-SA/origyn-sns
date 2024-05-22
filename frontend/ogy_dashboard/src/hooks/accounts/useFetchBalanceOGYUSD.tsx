import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import fetchPriceOGY from "@services/queries/accounts/fetchPriceOGY";
import { roundAndFormatLocale } from "@helpers/numbers/index";

const useFetchBalanceOGYUSD = ({
  balance,
}: {
  balance: number | undefined | null;
}) => {
  const [balanceUSD, setBalanceUSD] = useState<string | null | undefined>(null);

  const { data, isSuccess, isLoading, isError, error } = useQuery({
    queryKey: ["fetchPriceOGY"],
    queryFn: () => fetchPriceOGY(),
    placeholderData: keepPreviousData,
    enabled: !!balance,
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

export default useFetchBalanceOGYUSD;
