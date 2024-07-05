import { getActor } from "artemis-react";
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;

const getNeuronsByOwner = async (): Promise<string[]> => {
  const actor = await getActor("SNSRewards", { isAnon: false });
  const result = (await actor.get_neurons_by_owner()) as Array<
    { id: number[] }[]
  >;
  return result && result[0]
    ? result[0].map((neuron) => {
        return Buffer.from(neuron.id).toString("hex");
      })
    : [];
};

export default getNeuronsByOwner;
