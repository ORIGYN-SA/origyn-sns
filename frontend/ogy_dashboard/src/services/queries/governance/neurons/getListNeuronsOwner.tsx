import { Principal } from "@dfinity/principal";
import { ISystemNervousParametersResponse } from "@services/queries/governance/neurons/useGetNervousSystemParameters";
import getNeuronData from "./utils/getNeuronData";
import { INeuronResult } from "@services/types";
import { Buffer } from "buffer";
import { getActor } from "@services/actor";

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
  // Anonymous read: list_neurons is keyed by of_principal, no caller needed.
  const actor = await getActor("governance", { isAnon: true });
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
