import { useQuery } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import useConnect from "@hooks/useConnect";
import { getNervousSystemParameters } from "@services/queries/governance/neurons/useGetNervousSystemParameters";
import { getOneNeuronAll } from "@services/queries/governance/neurons/getOneNeuronAll";

const useNeuron = ({ neuronId }: { neuronId: string }) => {
  const { isConnected } = useConnect();
  const [governanceActor] = useCanister("governance");

  const {
    data: nervousSystemParameters,
    isSuccess: isSuccessGetNervousSystemParameters,
    isError: isErrorGetNervousSystemParameters,
    isLoading: isLoadingGetNervousSystemParameters,
    error: errorGetNervousSystemParameters,
  } = useQuery({
    queryKey: ["getNervousSystemParameters", isConnected],
    queryFn: () => getNervousSystemParameters({ governanceActor }),
    enabled: !!isConnected,
  });

  const {
    data: neuron,
    isSuccess: isSuccessGetOneNeuron,
    isError: isErrorGetOneNeuron,
    isLoading: isLoadingGetOneNeuron,
    error: errorGetOneNeuron,
  } = useQuery({
    queryKey: ["oneNeuronAll", neuronId, isConnected],
    queryFn: () =>
      getOneNeuronAll({
        neuronId,
        nervousSystemParameters,
      }),
    enabled: !!isConnected && !!isSuccessGetNervousSystemParameters,
  });

  const isSuccess =
    isSuccessGetNervousSystemParameters && isSuccessGetOneNeuron;

  const id = neuron?.id;
  const stakedAmount = neuron?.stakedAmountToString;
  const state = neuron?.state;
  const votingPower = neuron?.votingPowerToString;
  const dissolveDelay = neuron?.dissolveDelay;
  const age = neuron?.ageToRelativeCalendar;
  const stakedOGY = neuron?.stakedAmountToString;
  const stakedMaturity = neuron?.stakedMaturityToString;
  const createdAt = neuron?.createdAt;
  const ageBonus = neuron?.ageBonus;
  const maxAgeBonusPercentage = neuron?.maxAgeBonusPercentage;
  const dissolveDelayBonus = neuron?.dissolveDelayBonus;
  const vestingPeriod = neuron?.vestingPeriod ?? 0;
  const autoStakeMaturity = neuron?.autoStakeMaturity ?? 0;

  return {
    data: {
      id,
      stakedAmount,
      state,
      votingPower,
      dissolveDelay,
      age,
      stakedOGY,
      stakedMaturity,
      createdAt,
      ageBonus,
      maxAgeBonusPercentage,
      dissolveDelayBonus,
      vestingPeriod,
      autoStakeMaturity,
      details: [
        { name: "State", value: state },
        { name: "Staked Maturity", value: stakedMaturity },
        { name: "Staked OGY", value: stakedAmount },
        { name: "Dissolve Delay", value: dissolveDelay },
        { name: "Total Maturity", value: "TODO" },
        { name: "Age", value: age },
        { name: "Date Created", value: createdAt },
        { name: "Age Bonus", value: ageBonus },
        { name: "Total Bonus", value: maxAgeBonusPercentage },
        { name: "Auto-Stake Maturity", value: autoStakeMaturity },
        { name: "Vesting Period", value: vestingPeriod },
        { name: "Dissolve Delay Bonus", value: dissolveDelayBonus },
        { name: "Voting Power", value: votingPower },
      ],
    },
    isLoading: isLoadingGetOneNeuron || isLoadingGetNervousSystemParameters,
    isSuccess,
    isError: isErrorGetOneNeuron || isErrorGetNervousSystemParameters,
    error: errorGetOneNeuron || errorGetNervousSystemParameters,
  };
};

export default useNeuron;
