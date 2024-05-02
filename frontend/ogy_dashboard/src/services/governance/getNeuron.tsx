import { keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import { ActorSubclass } from "@dfinity/agent";

interface IGetNeuron {
  governanceActor: ActorSubclass;
  neuronId: string;
}

export const getNeuron = async ({ governanceActor, neuronId }: IGetNeuron) => {
  const result = await governanceActor.get_neuron({
    neuron_id: neuronId,
  });
  return result;
};

const useGetNeuron = ({
  neuronId,
  enabled,
}: {
  neuronId: string;
  enabled: boolean;
}) => {
  const { isConnected } = useConnect();
  const [governanceActor] = useCanister("governance");

  return {
    queryKey: ["getNeuron", governanceActor, isConnected, neuronId],
    queryFn: () =>
      getNeuron({
        governanceActor,
        neuronId,
      }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected && !!enabled,
  };
};

export default useGetNeuron;
