import { ProposalsMetrics } from "@services/types/token_metrics";
import { getActor } from "@amerej/artemis-react";

const fetchProposalsMetrics = async () => {
  const actor = await getActor("tokenMetrics", { isAnon: true });
  const result = (await actor.get_proposals_metrics()) as ProposalsMetrics;
  return result;
};

export default fetchProposalsMetrics;
