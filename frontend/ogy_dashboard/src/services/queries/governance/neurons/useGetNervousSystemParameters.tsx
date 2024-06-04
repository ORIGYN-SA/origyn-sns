import { keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@amerej/connect2ic-react";
import { ActorSubclass } from "@dfinity/agent";

interface IGetNervousSystemProps {
  governanceActor: ActorSubclass;
}

interface ISystemNervousParametersResult {
  max_neuron_age_for_age_bonus: bigint[];
  max_age_bonus_percentage: bigint[];
  max_dissolve_delay_bonus_percentage: bigint[];
  max_dissolve_delay_seconds: bigint[];
  neuron_minimum_dissolve_delay_to_vote_seconds: bigint[];
}

export interface ISystemNervousParametersResponse {
  maxNeuronAgeForAgeBonus: number;
  maxAgeBonusPercentage: number;
  maxDissolveDelayBonusPercentage: number;
  maxDissolveDelaySeconds: number;
  neuronMinimumDissolveDelayToVoteSeconds: number;
}

export const getNervousSystemParameters = async ({
  governanceActor,
}: IGetNervousSystemProps) => {
  const result = (await governanceActor.get_nervous_system_parameters(
    null
  )) as ISystemNervousParametersResult;
  return {
    maxNeuronAgeForAgeBonus:
      Number(result.max_neuron_age_for_age_bonus[0]) ?? 0,
    maxAgeBonusPercentage: Number(result.max_age_bonus_percentage[0]) ?? 0,
    maxDissolveDelayBonusPercentage:
      Number(result.max_dissolve_delay_bonus_percentage[0]) ?? 0,
    maxDissolveDelaySeconds: Number(result.max_dissolve_delay_seconds[0]) ?? 0,
    neuronMinimumDissolveDelayToVoteSeconds:
      Number(result.neuron_minimum_dissolve_delay_to_vote_seconds[0]) ?? 0,
  } as ISystemNervousParametersResponse;
};

const useGetNervousSystemParameters = () => {
  const { isConnected } = useConnect();
  const [governanceActor] = useCanister("governance");

  return {
    queryKey: ["getNervousSystemParameters", governanceActor, isConnected],
    queryFn: () =>
      getNervousSystemParameters({
        governanceActor,
      }),
    placeholderData: keepPreviousData,
    enabled: !!isConnected,
  };
};

export default useGetNervousSystemParameters;
