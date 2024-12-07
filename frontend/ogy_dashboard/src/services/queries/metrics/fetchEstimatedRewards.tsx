import { LockedNeuronsPeriodResponse } from "@services/types/token_metrics";
import { getActor } from "@amerej/artemis-react";

const fetchEstimatedRewards =
  async (): Promise<LockedNeuronsPeriodResponse> => {
    try {
      const actor = await getActor("tokenMetrics", { isAnon: true });
      const results =
        (await actor.get_locked_neurons_period()) as LockedNeuronsPeriodResponse;

      return results;
    } catch (error) {
      console.error("Error fetching estimated rewards:", error);
      throw error;
    }
  };

export default fetchEstimatedRewards;
