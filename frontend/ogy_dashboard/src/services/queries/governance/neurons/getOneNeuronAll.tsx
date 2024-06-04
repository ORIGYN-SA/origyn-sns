import { ISystemNervousParametersResponse } from "@services/queries/governance/neurons/useGetNervousSystemParameters";
import snsAPI from "@services/api/sns/v1";
import { SNS_ROOT_CANISTER } from "@constants/index";
import { INeuronResult } from "@services/types";
import getNeuronData from "./utils/getNeuronData";

export const getOneNeuronAll = async ({
  neuronId,
  nervousSystemParameters,
}: {
  neuronId: string;
  nervousSystemParameters?: ISystemNervousParametersResponse | undefined;
}) => {
  const { data }: { data: INeuronResult } = await snsAPI.get(
    `/snses/${SNS_ROOT_CANISTER}/neurons/${neuronId}`
  );

  return getNeuronData(data, nervousSystemParameters);
};
