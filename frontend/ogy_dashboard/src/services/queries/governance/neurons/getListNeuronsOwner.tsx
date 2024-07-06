import { Principal } from "@dfinity/principal";
import { ISystemNervousParametersResponse } from "@services/queries/governance/neurons/useGetNervousSystemParameters";
import getNeuronData from "./utils/getNeuronData";
import { INeuronResult } from "@services/types";
import { Buffer } from "buffer";
import { getActor } from "@amerej/artemis-react";
window.Buffer = window.Buffer || Buffer;

// Buffer.from(data.id[0].id).toString("hex")
// const dissolveState = data.dissolve_state[0];
// data.staked_maturity_e8s_equivalent[0]

export const getListNeuronsOwner = async ({
  owner,
  limit,
  neuronId,
  nervousSystemParameters,
}: {
  owner?: string;
  limit: number;
  neuronId?: string;
  nervousSystemParameters?: ISystemNervousParametersResponse | undefined;
}) => {
  const actor = await getActor("governance", { isAnon: false });
  const result = (await actor.list_neurons({
    of_principal: owner ? [Principal.fromText(owner)] : [],
    limit,
    start_page_at: neuronId
      ? [{ id: [...Uint8Array.from(Buffer.from(neuronId, "hex"))] }]
      : [],
  })) as { neurons: INeuronResult[] };

  return (
    result?.neurons?.map((data) => {
      return getNeuronData(data, nervousSystemParameters);
    }) ?? []
  );
};
