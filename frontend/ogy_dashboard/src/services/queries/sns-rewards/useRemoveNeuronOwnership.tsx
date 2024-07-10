import { useMutation } from "@tanstack/react-query";
import { getActor } from "@amerej/artemis-react";

const removeNeuronOwnership = async ({
  neuronId,
}: {
  neuronId: { id: number[] };
}) => {
  const actor = await getActor("SNSRewards", { isAnon: false });
  const result = await actor.remove_neuron_ownership(neuronId);
  return result;
};

const useRemoveNeuronOwnership = () => {
  return useMutation({
    mutationFn: ({ neuronId }: { neuronId: { id: number[] } }) =>
      removeNeuronOwnership({
        neuronId,
      }),
  });
};

export default useRemoveNeuronOwnership;
