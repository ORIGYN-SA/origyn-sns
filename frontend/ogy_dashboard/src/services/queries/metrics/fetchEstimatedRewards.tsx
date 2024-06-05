import { ActorSubclass } from "@dfinity/agent";
import { LockedNeuronsAmount } from "@services/types/token_metrics";

const fetchEstimatedRewards = async ({ actor }: { actor: ActorSubclass }) => {
  const results =
    (await actor.get_locked_neurons_period()) as LockedNeuronsAmount;
  return results;
};

export default fetchEstimatedRewards;
