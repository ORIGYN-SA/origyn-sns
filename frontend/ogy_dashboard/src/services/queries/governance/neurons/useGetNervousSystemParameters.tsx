import { keepPreviousData } from "@tanstack/react-query";
import { useWallet, getActor } from "artemis-react";

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

export const getNervousSystemParameters = async () => {
  const actor = await getActor("governance", { isAnon: true });
  const result = (await actor.get_nervous_system_parameters(
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
  const { isConnected } = useWallet();
  return {
    queryKey: ["getNervousSystemParameters", isConnected],
    queryFn: () => getNervousSystemParameters(),
    placeholderData: keepPreviousData,
    enabled: !!isConnected,
  };
};

export default useGetNervousSystemParameters;
