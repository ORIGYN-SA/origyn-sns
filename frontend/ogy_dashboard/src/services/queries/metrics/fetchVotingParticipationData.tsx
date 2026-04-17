import { getActor } from "@amerej/artemis-react";
import { ProposalsMetrics } from "@services/types/token_metrics";

export type VotingParticipationResponse = {
  metrics: ProposalsMetrics;
  history: Array<[bigint, bigint]>;
};

const periodToDays = (period: string): number =>
  period === "weekly" ? 7 : period === "monthly" ? 30 : 365;

const fetchVotingParticipationData = async ({
  period,
}: {
  period: string;
}): Promise<VotingParticipationResponse> => {
  const actor = await getActor("tokenMetrics", { isAnon: true });
  const [metrics, history] = await Promise.all([
    actor.get_proposals_metrics() as Promise<ProposalsMetrics>,
    actor.get_voting_participation_history({
      days: periodToDays(period),
    }) as Promise<Array<[bigint, bigint]>>,
  ]);
  return { metrics, history };
};

export default fetchVotingParticipationData;
