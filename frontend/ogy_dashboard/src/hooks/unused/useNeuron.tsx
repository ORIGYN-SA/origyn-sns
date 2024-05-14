import { useQuery } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import useConnect from "@hooks/useConnect";
import { getNervousSystemParameters } from "@services/queries/governance/useGetNervousSystemParameters";
import { fetchBalanceOGY } from "@services/queries/accounts/fetchBalanceOGY";
import { fetchPriceOGY } from "@services/queries/accounts/fetchPriceOGY";
import { getNeuron } from "@services/queries/governance/getNeuron";
import { SNS_REWARDS_CANISTER_ID } from "@constants/index";

const useNeuron = ({ neuronId }: { neuronId: string }) => {
  const { isConnected } = useConnect();
  const [governanceActor] = useCanister("governance");
  const [ledgerActor] = useCanister("ledger");

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
    isSuccess: isSuccessGetNeuron,
    isError: isErrorGetNeuron,
    isLoading: isLoadingGetNeuron,
    error: errorGetNeuron,
  } = useQuery({
    queryKey: ["getNeuron", isConnected],
    queryFn: () =>
      getNeuron({
        governanceActor,
        neuronId,
        nervousSystemParameters,
      }),
    enabled: !!isConnected && !!isSuccessGetNervousSystemParameters,
  });

  const {
    // data: priceOGY,
    isSuccess: isSuccessFetchPriceOGY,
    isError: isErrorFetchPriceOGY,
    isLoading: isLoadingFetchPriceOGY,
    error: errorFetchPriceOGY,
  } = useQuery({
    queryKey: ["fetchPriceOGY", isConnected],
    queryFn: () => fetchPriceOGY(),
    enabled:
      !!isConnected &&
      !!isSuccessGetNervousSystemParameters &&
      !!isSuccessGetNeuron,
  });

  const {
    data: claimBalance,
    isSuccess: isSuccessClaimBalance,
    isError: isErrorClaimBalance,
    isLoading: isLoadingClaimBalance,
    error: errorClaimBalance,
  } = useQuery({
    queryKey: ["getNeuronClaimBalance", ledgerActor, isConnected, neuronId],
    queryFn: () =>
      fetchBalanceOGY({
        actor: ledgerActor,
        owner: SNS_REWARDS_CANISTER_ID,
        subaccount: [...Uint8Array.from(Buffer.from(neuronId, "hex"))],
      }),
    enabled:
      !!isConnected &&
      !!isSuccessGetNervousSystemParameters &&
      !!isSuccessGetNeuron &&
      !!isSuccessFetchPriceOGY,
  });

  const isSuccess =
    isSuccessGetNervousSystemParameters &&
    isSuccessGetNeuron &&
    isSuccessFetchPriceOGY &&
    isSuccessClaimBalance;

  const id2Hex = neuron?.id2Hex;
  const stakedAmount = neuron?.stakedAmountToString;
  const claimAmount = claimBalance?.balanceOGY;
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

  return {
    data: {
      id: id2Hex,
      stakedAmount,
      claimAmount,
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
      pageDetails: [
        { name: "State", value: state },
        { name: "Staked Maturity", value: stakedMaturity },
        { name: "Staked OGY", value: stakedAmount },
        { name: "Dissolve Delay", value: dissolveDelay },
        { name: "Total Maturity", value: "TODO" },
        { name: "Age", value: age },
        { name: "Date Created", value: createdAt },
        { name: "Age Bonus", value: ageBonus },
        { name: "Total Bonus", value: maxAgeBonusPercentage },
        { name: "Auto-Stake Maturity", value: "TODO" },
        { name: "Vesting Period", value: "TODO" },
        { name: "Dissolve Delay Bonus", value: dissolveDelayBonus },
        { name: "Voting Power", value: votingPower },
      ],
    },
    isLoading:
      isLoadingGetNeuron ||
      isLoadingGetNervousSystemParameters ||
      isLoadingFetchPriceOGY ||
      isLoadingClaimBalance,
    isSuccess,
    isError:
      isErrorGetNeuron ||
      isErrorGetNervousSystemParameters ||
      isErrorFetchPriceOGY ||
      isErrorClaimBalance,
    error:
      errorGetNeuron ||
      errorGetNervousSystemParameters ||
      errorFetchPriceOGY ||
      errorClaimBalance,
  };
};

export default useNeuron;
