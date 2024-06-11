import { useQuery } from "@tanstack/react-query";
import { useCanister } from "@amerej/connect2ic-react";
import { getNervousSystemParameters } from "@services/queries/governance/neurons/useGetNervousSystemParameters";
import { getOneNeuronAll } from "@services/queries/governance/neurons/getOneNeuronAll";

const useNeuron = ({ neuronId }: { neuronId: string }) => {
  const [governanceActor] = useCanister("governance");

  const {
    data: nervousSystemParameters,
    isSuccess: isSuccessGetNervousSystemParameters,
    isError: isErrorGetNervousSystemParameters,
    isLoading: isLoadingGetNervousSystemParameters,
    error: errorGetNervousSystemParameters,
  } = useQuery({
    queryKey: ["getNervousSystemParameters"],
    queryFn: () => getNervousSystemParameters({ governanceActor }),
  });

  const {
    data: neuron,
    isSuccess: isSuccessGetOneNeuron,
    isError: isErrorGetOneNeuron,
    isLoading: isLoadingGetOneNeuron,
    error: errorGetOneNeuron,
  } = useQuery({
    queryKey: ["oneNeuronAll", neuronId],
    queryFn: () =>
      getOneNeuronAll({
        neuronId,
        nervousSystemParameters,
      }),
    enabled: !!isSuccessGetNervousSystemParameters,
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
  // const vestingPeriod = neuron?.vestingPeriod ?? 0;
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
      autoStakeMaturity,
      details: [
        { name: "State", value: state },
        { name: "Staked Maturity", value: stakedMaturity },
        { name: "Staked OGY", value: stakedAmount },
        { name: "Dissolve Delay", value: dissolveDelay },
        { name: "Total Maturity", value: "-" },
        { name: "Age", value: age },
        { name: "Date Created", value: createdAt },
        { name: "Age Bonus", value: ageBonus },
        { name: "Total Bonus", value: maxAgeBonusPercentage },
        { name: "Auto-Stake Maturity", value: autoStakeMaturity },
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
