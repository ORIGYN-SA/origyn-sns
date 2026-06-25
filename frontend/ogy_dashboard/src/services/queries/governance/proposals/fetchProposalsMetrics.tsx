import { ProposalsMetrics } from "@services/types/token_metrics";
import gldtAPI from "@services/api/gldt/v1";
import { ApiProposalsMetrics } from "@services/api/gldt/v1/types";
import { gldtTokenPath, toBigInt } from "@services/api/gldt/v1/utils";

const fetchProposalsMetrics = async (): Promise<ProposalsMetrics> => {
  const { data } = await gldtAPI.get<ApiProposalsMetrics>(
    gldtTokenPath("governance/proposals/metrics")
  );
  return {
    daily_voting_rewards: toBigInt(data.daily_voting_rewards),
    reward_base_current_year: toBigInt(data.reward_base_current_year),
    average_voting_participation: toBigInt(data.average_voting_participation),
    average_voting_power: toBigInt(data.average_voting_power),
    total_voting_power: toBigInt(data.total_voting_power),
    total_proposals: toBigInt(data.total_proposals),
  };
};

export default fetchProposalsMetrics;
