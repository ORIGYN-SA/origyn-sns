import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { ChartData } from "@services/types/charts.types";
import { getActor } from "@amerej/artemis-react";
import { VotingParticipationHistory } from "@hooks/token_metrics/declarations_files/token_metrics";
import { ProposalsMetrics } from "@services/types/token_metrics";
import { divideBy1e8 } from "@helpers/numbers";

const useVotingPowerData = ({ period }: { period: string }) => {
  const [data, setData] = useState<{
    total: string;
    dataChart: ChartData[];
    stakePower: string;
    votingPower: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        const actor = await getActor("tokenMetrics", { isAnon: true });

        const metrics =
          (await actor.get_proposals_metrics()) as ProposalsMetrics;
        const days = period === "weekly" ? 7 : period === "monthly" ? 30 : 365;
        const history = (await actor.get_voting_power_ratio_history({
          days,
        })) as VotingParticipationHistory;

        const historyData = history.map(([day, balance]: [bigint, number]) => {
          const dateName = DateTime.fromMillis(0)
            .plus({ days: Number(day) })
            .toFormat("MMM dd yyyy"); // Inclure l'année
          return {
            name: dateName,
            value: Number(balance),
            valueToString: balance.toLocaleString("en-US"),
          };
        });

        const stakePower = divideBy1e8(
          metrics.reward_base_current_year
        ).toLocaleString("en-US");
        const votingPower = divideBy1e8(
          metrics.total_voting_power
        ).toLocaleString("en-US");

        setData({
          dataChart: historyData,
          total: historyData[historyData.length - 1]?.valueToString ?? "0",
          stakePower,
          votingPower,
        });
      } catch (error) {
        console.error("Error fetching voting power data:", error);
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

export default useVotingPowerData;
