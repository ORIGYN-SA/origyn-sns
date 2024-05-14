import { useMutation } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import { ActorSubclass } from "@dfinity/agent";

interface IRemoveNeuronOwnership {
  snsRewardsActor: ActorSubclass;
  neuronId: { id: number[] };
}

const removeNeuronOwnership = async ({
  snsRewardsActor,
  neuronId,
}: IRemoveNeuronOwnership) => {
  const result = await snsRewardsActor.claim_reward({
    token: "OGY",
    neuron_id: neuronId,
  });
  return result;
};

const useRemoveNeuronOwnership = () => {
  const [snsRewardsActor] = useCanister("SNSRewards");

  return useMutation({
    mutationFn: ({ neuronId }: { neuronId: { id: number[] } }) =>
      removeNeuronOwnership({
        snsRewardsActor,
        neuronId,
      }),
  });
};

export default useRemoveNeuronOwnership;
