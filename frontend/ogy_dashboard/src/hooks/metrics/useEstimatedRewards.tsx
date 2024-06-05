import { useState, useEffect } from "react";
import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import { useCanister } from "@amerej/connect2ic-react";
import fetchEstimatedRewards from "@services/queries/metrics/fetchEstimatedRewards";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers/index";
import { LockedNeuronsAmount } from "@services/types/token_metrics";

interface IEstimatedReward {
  value: number;
  label: string;
  rate: string;
  locked: string;
  lockedSum: string | null;
}

const useEstimatedRewards = () => {
  const [tokenMetricsActor] = useCanister("tokenMetrics");
  const [estimatedRewards, setEstimatedRewards] = useState<
    IEstimatedReward[] | null
  >(null);
  const REWARD_RATE = 0.01;
  const STEPS = [1, 1.15, 1.4, 1.65, 2];
  const STEPS_LENGTH = 5;

  const {
    data,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<LockedNeuronsAmount> = useQuery({
    queryKey: ["estimatedRewards"],
    queryFn: () =>
      fetchEstimatedRewards({
        actor: tokenMetricsActor,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isSuccess) {
      const staked = [
        divideBy1e8(data.one_year),
        divideBy1e8(data.two_years),
        divideBy1e8(data.three_years),
        divideBy1e8(data.four_years),
        divideBy1e8(data.five_years),
      ];
      const totalLocked = staked.reduce(
        (accumulator, currentValue, index) =>
          accumulator + currentValue * STEPS[index],
        0
      );
      setEstimatedRewards(
        staked.map((d: number, index: number) => {
          const result = {
            value: index + 1,
            label: ``,
            rate: `${(
              Math.round(STEPS[index] * (REWARD_RATE * Number(totalLocked))) /
              1000000
            ).toFixed(1)} %`,
            locked: roundAndFormatLocale({ number: d }),
            lockedSum:
              index < STEPS_LENGTH - 1
                ? roundAndFormatLocale({
                    number: staked
                      .slice(index, STEPS_LENGTH)
                      .reduce(
                        (accumulator, currentValue) =>
                          accumulator + currentValue,
                        0
                      ),
                  })
                : null,
          };
          return result;
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, data]);

  return { data: estimatedRewards, isSuccess, isError, isLoading, error };
};

export default useEstimatedRewards;
