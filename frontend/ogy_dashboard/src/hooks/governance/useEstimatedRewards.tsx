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
  const REWARD_RATE = 250000000;
  const STEPS = [1, 1.25, 1.5, 1.75, 2];
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
      const totalVotingPower = staked.reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
      );

      setEstimatedRewards(
        STEPS.map((step: number, index: number) => {
          const result = {
            value: index + 1,
            label: ``,
            rate: `${(
              (step / 3) *
              (REWARD_RATE / totalVotingPower) *
              100
            ).toFixed(1)} %`,
            locked: roundAndFormatLocale({ number: staked[index] }),
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