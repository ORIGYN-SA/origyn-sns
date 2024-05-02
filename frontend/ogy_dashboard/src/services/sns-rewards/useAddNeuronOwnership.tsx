import { useMutation } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import { ActorSubclass } from "@dfinity/agent";

interface IGetNeuronsByOwner {
  snsRewardsActor: ActorSubclass;
  neuronId: string;
}

const addNeuronOwnership = async ({
  snsRewardsActor,
  neuronId,
}: IGetNeuronsByOwner) => {
  const id = [...Uint8Array.from(Buffer.from(neuronId, "hex"))];
  const result = await snsRewardsActor.add_neuron_ownership({
    id,
  });
  return result;
};

const useAddNeuronOwnership = () => {
  const [snsRewardsActor] = useCanister("SNSRewards");

  return useMutation({
    mutationFn: ({ neuronId }: { neuronId: string }) =>
      addNeuronOwnership({
        snsRewardsActor,
        neuronId,
      }),
  });
};

export default useAddNeuronOwnership;
