import { useMutation } from "@tanstack/react-query";
import { getActor } from "artemis-react";

const claimReward = async ({ neuronId }: { neuronId: { id: number[] } }) => {
  const actor = await getActor("SNSRewards", { isAnon: false });
  const result = await actor.claim_reward({
    token: "OGY",
    neuron_id: neuronId,
  });
  return result;
};

const useClaimReward = () => {
  return useMutation({
    mutationFn: ({ neuronId }: { neuronId: { id: number[] } }) =>
      claimReward({
        neuronId,
      }),
  });
};

export default useClaimReward;
