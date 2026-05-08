import { useMemo } from "react";
import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import fetchEstimatedRewards from "@services/queries/metrics/fetchEstimatedRewards";
import { roundAndFormatLocale, divideBy1e8 } from "@helpers/numbers/index";
import { LockedNeuronsPeriodResponse } from "@services/types/token_metrics";

export interface IEstimatedReward {
  value: number;
  label: string;
  rate: string;
  locked: string;
  lockedSum: string | null;
  count: number;
  countSum: number;
}

const REWARD_RATE = 125000000;
const STEPS = [1, 1.25, 1.5, 1.75, 2];
const STEPS_LENGTH = 5;

const useEstimatedRewards = () => {
  const {
    data,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<LockedNeuronsPeriodResponse> = useQuery({
    queryKey: ["estimatedRewards"],
    queryFn: () => fetchEstimatedRewards(),
    placeholderData: keepPreviousData,
  });

  const estimatedRewards: IEstimatedReward[] | null = useMemo(() => {
    if (!isSuccess || !data) return null;

    const staked = [
      divideBy1e8(data.amount.one_year),
      divideBy1e8(data.amount.two_years),
      divideBy1e8(data.amount.three_years),
      divideBy1e8(data.amount.four_years),
      divideBy1e8(data.amount.five_years),
    ];
    const counts = [
      Number(data.count.one_year),
      Number(data.count.two_years),
      Number(data.count.three_years),
      Number(data.count.four_years),
      Number(data.count.five_years),
    ];

    const cumulativeCounts = counts.map((_, index) =>
      counts.slice(index).reduce((acc, current) => acc + current, 0)
    );

    const totalVotingPower = staked.reduce(
      (accumulator, currentValue, index) =>
        accumulator + currentValue * STEPS[index],
      0
    );

    return STEPS.map((step, index) => {
      const votingPower = staked[index] * step;
      const votingPowerShare = votingPower / totalVotingPower;
      const rewardShare = REWARD_RATE * votingPowerShare;
      const rate = (rewardShare / staked[index]) * 100;
      return {
        value: index + 1,
        label: "",
        rate: `${rate.toFixed(1)} %`,
        locked: roundAndFormatLocale({ number: staked[index] }),
        lockedSum:
          index < STEPS_LENGTH - 1
            ? roundAndFormatLocale({
                number: staked
                  .slice(index, STEPS_LENGTH)
                  .reduce((acc, val) => acc + val, 0),
              })
            : null,
        countSum: cumulativeCounts[index],
        count: counts[index],
      };
    });
  }, [isSuccess, data]);

  return { data: estimatedRewards, isSuccess, isError, isLoading, error };
};

export default useEstimatedRewards;
