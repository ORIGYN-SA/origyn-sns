import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { ChartData } from "@services/types/charts.types";
import { getActor } from "@amerej/artemis-react";
import { ProposalsMetrics } from "@services/types/token_metrics";
import { divideBy1e8 } from "@helpers/numbers";

type VotingParticipationHistory = Array<[bigint, number]>; // History of participation

const useVotingParticipationData = ({ period }: { period: string }) => {
  const [data, setData] = useState<{
    lastParticipation: string;
    averageParticipation: string;
    averagePower: string;
    dataChart: ChartData[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        const actor = await getActor("tokenMetrics", { isAnon: true });
        const days = period === "weekly" ? 7 : period === "monthly" ? 30 : 365;

        const metrics =
          (await actor.get_proposals_metrics()) as ProposalsMetrics;
        console.log("metrics:", metrics);

        console.log("metrics.total_voting_power:", metrics.total_voting_power);

        const history = (await actor.get_voting_participation_history({
          days,
        })) as VotingParticipationHistory;
        console.log("history:", history);

        const historyData = history.map(([day, participation]) => ({
          name: DateTime.fromMillis(0)
            .plus({ days: Number(day) })
            .toFormat("LLL dd"),
          value: Number(participation),
        }));

        const scaledTotalVotingPower = divideBy1e8(metrics.total_voting_power);
        console.log("scaledTotalVotingPower:", scaledTotalVotingPower);

        const lastParticipationRaw =
          historyData[historyData.length - 1]?.value || 0;
        console.log("lastParticipationRaw:", lastParticipationRaw);

        const calcLastParticipation =
          (lastParticipationRaw * 100) / scaledTotalVotingPower;
        console.log("calcLastParticipation:", calcLastParticipation);

        const lastParticipation =
          scaledTotalVotingPower > 0
            ? calcLastParticipation.toFixed(2) + "%"
            : "0%";
        console.log("lastParticipation:", lastParticipation);

        console.log(
          "metrics.average_voting_participation:",
          metrics.average_voting_participation
        );
        const averageParticipation =
          scaledTotalVotingPower > 0
            ? (
                (Number(metrics.average_voting_participation) * 100) /
                scaledTotalVotingPower
              ).toFixed(2) + "%"
            : "0%";
        console.log("averageParticipation:", averageParticipation);

        setData({
          lastParticipation,
          averageParticipation,
          averagePower: divideBy1e8(
            metrics.average_voting_power
          ).toLocaleString("en-US"),
          dataChart: historyData.map((item) => ({
            ...item,
            value:
              scaledTotalVotingPower > 0
                ? (item.value * 100) / scaledTotalVotingPower
                : 0,
          })),
        });
      } catch (error) {
        console.error("Error fetching voting participation data:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  return {
    data,
    isSuccess: !!data,
    isError,
    isLoading,
  };
};

export default useVotingParticipationData;
