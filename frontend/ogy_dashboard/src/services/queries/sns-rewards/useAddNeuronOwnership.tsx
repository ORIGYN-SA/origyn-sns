import { useMutation } from "@tanstack/react-query";
import { getActor } from "@amerej/artemis-react";
import type { Response } from "@services/types/sns_rewards";
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;

const addNeuronOwnership = async ({ neuronId }: { neuronId: string }) => {
  const id = [...Uint8Array.from(Buffer.from(neuronId, "hex"))];
  const actor = await getActor("SNSRewards", { isAnon: false });
  const result = (await actor.add_neuron_ownership({
    id,
  })) as Response;

  return Object.keys(result).toString();
};

const useAddNeuronOwnership = () => {
  return useMutation({
    mutationFn: ({ neuronId }: { neuronId: string }) =>
      addNeuronOwnership({
        neuronId,
      }),
  });
};

export default useAddNeuronOwnership;
