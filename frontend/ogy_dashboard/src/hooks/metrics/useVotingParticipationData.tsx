import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { ChartData } from "@services/types/charts.types";
import { getActor } from "@amerej/artemis-react";
import { ProposalsMetrics } from "@services/types/token_metrics";
import { divideBy1e8 } from "@helpers/numbers";

type VotingParticipationHistory = Array<[bigint, number]>;

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
        const history = (await actor.get_voting_participation_history({
          days,
        })) as VotingParticipationHistory;

        const historyData = history.map(([day, participation]) => ({
          name: DateTime.fromMillis(0)
            .plus({ days: Number(day) })
            .toFormat("LLL dd"),
          value: Number(participation),
        }));

        const lastParticipation =
          historyData[historyData.length - 1]?.value || 0;

        setData({
          lastParticipation: lastParticipation.toLocaleString("en-US"),
          averageParticipation:
            metrics.average_voting_participation.toLocaleString("en-US"),
          averagePower: divideBy1e8(
            metrics.average_voting_power
          ).toLocaleString("en-US"),
          dataChart: historyData,
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
