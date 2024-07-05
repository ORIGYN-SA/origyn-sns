import { useState, useEffect } from "react";
import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import fetchSupplyDataOGY from "@services/queries/metrics/fetchSupplyDataOGY";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers/index";
import { PieChartData } from "@components/charts/pie/Pie";
import { TokenSupplyData } from "@services/types/token_metrics";
import fetchFoundationAssetsOGY from "@services/queries/metrics/fetchFoundationAssetsOGY";

interface ICirculationStateOGY {
  number: { circulatingSupply: number; totalSupply: number };
  string: { circulatingSupply: string; totalSupply: string };
  dataPieChart: PieChartData[];
}

const useCirculationStateOGY = () => {
  const [foundationReserve, setFoundationReserve] =
    useState<ICirculationStateOGY | null>(null);

  const {
    data,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<TokenSupplyData> = useQuery({
    queryKey: ["circulationStateOGY"],
    queryFn: () => fetchSupplyDataOGY(),
    placeholderData: keepPreviousData,
  });

  const {
    data: dataReserve,
    isSuccess: isSuccessreserve,
    isLoading: isLoadingReserve,
    isError: isErrorReserve,
    error: errorReserve,
  }: UseQueryResult<{ total_locked: number }> = useQuery({
    queryKey: ["foundationAssets"],
    queryFn: () => fetchFoundationAssetsOGY(),
    placeholderData: keepPreviousData,
  });

  const isSuccessAll = isSuccess && isSuccessreserve;

  useEffect(() => {
    if (isSuccessAll && data && dataReserve) {
      const totalSupply = Number(divideBy1e8(data.total_supply));
      const circulatingSupply = Number(divideBy1e8(data.circulating_supply));
      const totalLocked = dataReserve.total_locked;

      setFoundationReserve({
        number: {
          circulatingSupply,
          totalSupply,
        },
        string: {
          circulatingSupply: roundAndFormatLocale({
            number: circulatingSupply,
          }),
          totalSupply: roundAndFormatLocale({ number: totalSupply }),
        },
        dataPieChart: [
          {
            name: "OGY not in the hand of the Foundation",
            value: circulatingSupply - totalLocked,
            valueToString: roundAndFormatLocale({
              number: circulatingSupply - totalLocked,
            }),
          },
          {
            name: "OGY locked in the hand of the Foundation",
            value: totalLocked,
            valueToString: roundAndFormatLocale({
              number: totalLocked,
            }),
          },
        ],
      });
    }
  }, [isSuccessAll, data, dataReserve]);

  return {
    data: foundationReserve,
    isSuccess: isSuccessAll,
    isError: isError || isErrorReserve,
    isLoading: isLoading || isLoadingReserve,
    error: error || errorReserve,
  };
};

export default useCirculationStateOGY;
