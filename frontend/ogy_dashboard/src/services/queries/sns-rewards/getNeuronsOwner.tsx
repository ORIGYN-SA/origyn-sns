import { ActorSubclass } from "@dfinity/agent";
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;

const getNeuronsByOwner = async ({
  snsRewardsActor,
}: {
  snsRewardsActor: ActorSubclass;
}): Promise<string[]> => {
  const result = (await snsRewardsActor.get_neurons_by_owner()) as Array<
    { id: number[] }[]
  >;
  return result && result[0]
    ? result[0].map((neuron) => {
        return Buffer.from(neuron.id).toString("hex");
      })
    : [];
};

export default getNeuronsByOwner;
