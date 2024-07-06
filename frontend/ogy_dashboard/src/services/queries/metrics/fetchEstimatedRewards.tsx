import { LockedNeuronsAmount } from "@services/types/token_metrics";
import { getActor } from "@amerej/artemis-react";

const fetchEstimatedRewards = async () => {
  const actor = await getActor("tokenMetrics", { isAnon: true });
  const results =
    (await actor.get_locked_neurons_period()) as LockedNeuronsAmount;
  return results;
};

export default fetchEstimatedRewards;
