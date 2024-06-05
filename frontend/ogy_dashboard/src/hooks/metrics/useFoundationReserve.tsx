import { useState, useEffect } from "react";
import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import { useCanister } from "@amerej/connect2ic-react";
import fetchFoundationAssetsOGY from "@services/queries/metrics/fetchFoundationAssetsOGY";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers/index";
import { PieChartData } from "@components/charts/pie/Pie";
import { WalletOverview } from "@services/types/token_metrics";

interface IFoundationReserve {
  number: {
    totalSupply: number;
    totalSupplyLocked: number;
    totalSupplyUnlocked: number;
    totalStaked: number;
  };
  string: {
    totalSupply: string;
    totalSupplyLocked: string;
    totalSupplyUnlocked: string;
    totalStaked: string;
  };
  dataPieChart: PieChartData[];
}

const useOGYCirculationState = () => {
  const [tokenMetricsActor] = useCanister("tokenMetrics");
  const [foundationReserve, setFoundationReserve] =
    useState<IFoundationReserve | null>(null);

  const {
    data,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<WalletOverview> = useQuery({
    queryKey: ["foundationAssets"],
    queryFn: () =>
      fetchFoundationAssetsOGY({
        actor: tokenMetricsActor,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isSuccess && data) {
      const governance = data.governance;

      const totalSupply = divideBy1e8(data.total);
      const totalSupplyLocked = divideBy1e8(governance.total_staked);
      const totalSupplyUnlocked = divideBy1e8(governance.total_unlocked);
      const totalStaked = divideBy1e8(governance.total_staked);

      setFoundationReserve({
        number: {
          totalSupply,
          totalSupplyLocked,
          totalSupplyUnlocked,
          totalStaked,
        },
        string: {
          totalSupply: roundAndFormatLocale({ number: totalSupply }),
          totalSupplyLocked: roundAndFormatLocale({
            number: totalSupplyLocked,
          }),
          totalSupplyUnlocked: roundAndFormatLocale({
            number: totalSupplyUnlocked,
          }),
          totalStaked: roundAndFormatLocale({ number: totalStaked }),
        },
        dataPieChart: [
          {
            name: "Locked",
            value: totalSupplyLocked,
            valueToString: roundAndFormatLocale({
              number: totalSupplyLocked,
            }),
          },
          {
            name: "Unlocked",
            value: totalSupplyUnlocked,
            valueToString: roundAndFormatLocale({
              number: totalSupplyUnlocked,
            }),
          },
        ],
      });
    }
  }, [isSuccess, data]);

  return { data: foundationReserve, isSuccess, isError, isLoading, error };
};

export default useOGYCirculationState;
