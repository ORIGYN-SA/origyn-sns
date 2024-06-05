import { useState, useEffect } from "react";
import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import { useCanister } from "@amerej/connect2ic-react";
import fetchSupplyDataOGY from "@services/queries/metrics/fetchSupplyDataOGY";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers/index";
import { PieChartData } from "@components/charts/pie/Pie";
import { TokenSupplyData } from "@services/types/token_metrics";

interface ICirculationStateOGY {
  number: { circulatingSupply: number; totalSupply: number };
  string: { circulatingSupply: string; totalSupply: string };
  dataPieChart: PieChartData[];
}

const useCirculationStateOGY = () => {
  const [tokenMetricsActor] = useCanister("tokenMetrics");
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
    queryFn: () =>
      fetchSupplyDataOGY({
        actor: tokenMetricsActor,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isSuccess) {
      const totalSupply = Number(divideBy1e8(data.total_supply));
      const circulatingSupply = Number(divideBy1e8(data.circulating_supply));

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
            name: "Locked",
            value: totalSupply,
            valueToString: roundAndFormatLocale({
              number: divideBy1e8(totalSupply),
            }),
          },
          {
            name: "Unlocked",
            value: totalSupply,
            valueToString: roundAndFormatLocale({
              number: divideBy1e8(totalSupply),
            }),
          },
        ],
      });
    }
  }, [isSuccess, data]);

  return { data: foundationReserve, isSuccess, isError, isLoading, error };
};

export default useCirculationStateOGY;
