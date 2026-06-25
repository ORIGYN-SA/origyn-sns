import { ProposalsMetrics } from "@services/types/token_metrics";
import gldtAPI from "@services/api/gldt/v1";
import { ApiParticipationHistoryItem } from "@services/api/gldt/v1/types";
import { gldtTokenPath, toBigInt } from "@services/api/gldt/v1/utils";
import fetchProposalsMetrics from "@services/queries/governance/proposals/fetchProposalsMetrics";

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
  const [metrics, { data: history }] = await Promise.all([
    fetchProposalsMetrics(),
    gldtAPI.get<ApiParticipationHistoryItem[]>(
      gldtTokenPath("governance/voting/participation-history", {
        days: periodToDays(period),
      })
    ),
  ]);
  return {
    metrics,
    history: history.map(
      ({ day, participation }) =>
        [toBigInt(day), toBigInt(participation)] as [bigint, bigint]
    ),
  };
};

export default fetchVotingParticipationData;
