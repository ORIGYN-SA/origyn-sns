import { ActorSubclass } from "@dfinity/agent";
import { ProposalsMetrics } from "@services/types/token_metrics";

const fetchProposalsMetrics = async ({ actor }: { actor: ActorSubclass }) => {
  const result = (await actor.get_proposals_metrics()) as ProposalsMetrics;
  return result;
};

export default fetchProposalsMetrics;
