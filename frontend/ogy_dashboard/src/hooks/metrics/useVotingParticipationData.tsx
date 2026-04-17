import { useMemo } from "react";
import { DateTime } from "luxon";
import {
  useQuery,
  keepPreviousData,
  UseQueryResult,
} from "@tanstack/react-query";
import fetchVotingParticipationData, {
  VotingParticipationResponse,
} from "@services/queries/metrics/fetchVotingParticipationData";
import { ChartData } from "@services/types/charts.types";
import { divideBy1e8 } from "@helpers/numbers";

const useVotingParticipationData = ({ period }: { period: string }) => {
  const {
    data: response,
    isSuccess,
    isLoading,
    isError,
    error,
  }: UseQueryResult<VotingParticipationResponse> = useQuery({
    queryKey: ["votingParticipation", period],
    queryFn: () => fetchVotingParticipationData({ period }),
    placeholderData: keepPreviousData,
  });

  const data = useMemo<{
    lastParticipation: string;
    averageParticipation: string;
    averagePower: string;
    dataChart: ChartData[];
  } | undefined>(() => {
    if (!isSuccess || !response) return undefined;

    const dataChart = response.history.map(([day, participation]) => ({
      name: DateTime.fromMillis(0)
        .plus({ days: Number(day) })
        .toFormat("LLL dd"),
      value: Number(participation),
    }));

    const lastParticipationRaw = dataChart[dataChart.length - 1]?.value ?? 0;
    const calcLastParticipation = lastParticipationRaw / 100;
    const lastParticipation =
      calcLastParticipation > 0
        ? calcLastParticipation.toFixed(2) + "%"
        : "0%";

    const averageParticipation =
      response.metrics.average_voting_participation > 0
        ? (Number(response.metrics.average_voting_participation) / 100).toFixed(
            2
          ) + "%"
        : "0%";

    return {
      lastParticipation,
      averageParticipation,
      averagePower: divideBy1e8(
        response.metrics.average_voting_power
      ).toLocaleString("en-US"),
      dataChart,
    };
  }, [isSuccess, response]);

  return {
    data,
    isSuccess: isSuccess && !!data,
    isLoading: isLoading || (!data && !isError),
    isError,
    error,
  };
};

export default useVotingParticipationData;
