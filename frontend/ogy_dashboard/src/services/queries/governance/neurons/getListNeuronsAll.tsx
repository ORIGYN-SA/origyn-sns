import { ISystemNervousParametersResponse } from "@services/queries/governance/neurons/useGetNervousSystemParameters";
import snsAPI from "@services/api/sns/v1";
import { SNS_ROOT_CANISTER } from "@constants/index";
import { INeuronResult } from "@services/types";
import getNeuronData from "./utils/getNeuronData";

interface IGetListNeuronsAll {
  limit: number;
  offset: number;
  nervousSystemParameters?: ISystemNervousParametersResponse | undefined;
}

export const getListNeuronsAll = async ({
  limit = 10,
  offset = 0,
  nervousSystemParameters,
}: IGetListNeuronsAll) => {
  const { data }: { data: { data: INeuronResult[]; total_neurons: number } } =
    await snsAPI.get(
      `/snses/${SNS_ROOT_CANISTER}/neurons?offset=${offset}&limit=${limit}&sort_by=-created_timestamp_seconds`
    );

  return {
    totalNeurons: data.total_neurons,
    data:
      data?.data?.map((data) => {
        return getNeuronData(data, nervousSystemParameters);
      }) ?? [],
  };
};
