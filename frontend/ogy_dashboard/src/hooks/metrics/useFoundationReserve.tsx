import { useState, useEffect } from "react";
import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import fetchFoundationAssetsOGY from "@services/queries/metrics/fetchFoundationAssetsOGY";
import { roundAndFormatLocale } from "@helpers/numbers/index";
import { PieChartData } from "@components/charts/pie/Pie";

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
  const [foundationReserve, setFoundationReserve] =
    useState<IFoundationReserve | null>(null);

  const {
    data,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<{
    total: number;
    total_locked: number;
    total_unlocked: number;
    total_staked: number;
  }> = useQuery({
    queryKey: ["foundationAssets"],
    queryFn: () => fetchFoundationAssetsOGY(),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isSuccess && data) {
      const totalSupply = data.total;
      const totalSupplyLocked = data.total_locked;
      const totalSupplyUnlocked = data.total - data.total_locked;
      const totalStaked = data.total_staked;

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
