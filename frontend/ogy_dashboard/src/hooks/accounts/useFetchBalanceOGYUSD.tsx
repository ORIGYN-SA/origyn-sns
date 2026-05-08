import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import fetchPriceOGY from "@services/queries/accounts/fetchPriceOGY";
import { roundAndFormatLocale } from "@helpers/numbers/index";

const useFetchBalanceOGYUSD = ({
  balance,
}: {
  balance: number | undefined | null;
}) => {
  const priceQuery = useQuery({
    queryKey: ["fetchPriceOGY"],
    queryFn: () => fetchPriceOGY(),
    placeholderData: keepPreviousData,
    enabled: balance !== undefined && balance !== null,
  });

  const balanceUSD = useMemo(() => {
    if (balance === undefined || balance === null || !priceQuery.data) {
      return undefined;
    }
    return roundAndFormatLocale({
      number: balance * Number(priceQuery.data.ogyPrice),
      decimals: 4,
    });
  }, [balance, priceQuery.data]);

  return {
    data: balanceUSD,
    isSuccess: priceQuery.isSuccess,
    isLoading: priceQuery.isLoading,
    isError: priceQuery.isError,
    error: priceQuery.error,
  };
};

export default useFetchBalanceOGYUSD;
