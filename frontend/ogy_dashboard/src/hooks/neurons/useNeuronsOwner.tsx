import { useState, useEffect } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import useConnect from "@hooks/useConnect";
import { getNervousSystemParameters } from "@services/queries/governance/neurons/useGetNervousSystemParameters";
import fetchBalanceOGY from "@services/queries/accounts/fetchBalanceOGY";
import { getListNeuronsOwner } from "@services/queries/governance/neurons/getListNeuronsOwner";
import { SNS_REWARDS_CANISTER_ID } from "@constants/index";
import { roundAndFormatLocale } from "@helpers/numbers";

const useNeuronsOwner = ({
  limit,
  owner,
  neuronId,
}: {
  limit: number;
  owner?: string;
  neuronId?: string;
}) => {
  const { isConnected } = useConnect();
  const [governanceActor] = useCanister("governance");
  const [ledgerActor] = useCanister("ledger");
  const [totalStakedOGY, setTotalStakedOGY] = useState<null | number>(null);
  const [totalStakedRewardsOGY, setTotalStakedRewardsOGY] = useState<
    null | number
  >(null);

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
    data: neurons,
    isSuccess: isSuccessListNeurons,
    isError: isErrorListNeurons,
    isLoading: isLoadingListNeurons,
    error: errorListNeurons,
  } = useQuery({
    queryKey: ["userListNeuronsAll", limit, isConnected],
    queryFn: () =>
      getListNeuronsOwner({
        governanceActor,
        owner,
        limit,
        neuronId,
        nervousSystemParameters,
      }),
    enabled: !!isConnected && !!isSuccessGetNervousSystemParameters,
  });

  const neuronClaimBalance = useQueries({
    queries:
      neurons?.map(({ id: neuronId }) => {
        return {
          queryKey: [
            "getNeuronClaimBalance",
            ledgerActor,
            isConnected,
            neuronId,
          ],
          queryFn: () =>
            fetchBalanceOGY({
              actor: ledgerActor,
              owner: SNS_REWARDS_CANISTER_ID,
              subaccount: Buffer.from(neuronId.id).toString("hex"),
            }),
          enabled:
            !!isConnected &&
            !!isSuccessGetNervousSystemParameters &&
            !!isSuccessListNeurons,
        };
      }) ?? [],
  });

  const isSuccess =
    isSuccessGetNervousSystemParameters &&
    isSuccessListNeurons &&
    neuronClaimBalance.every((result) => result.isSuccess);

  const _totalStakedRewardsOGY = neuronClaimBalance.reduce(
    (accumulator, currentValue) =>
      accumulator + (currentValue.data ? currentValue.data.balance : 0),
    0
  );

  const _totalStakedOGY =
    neurons?.reduce(
      (accumulator, currentValue) =>
        accumulator + (currentValue ? currentValue.stakedAmount : 0),
      0
    ) ?? 0;

  useEffect(() => {
    if (isSuccess) {
      setTotalStakedRewardsOGY(_totalStakedRewardsOGY);
      setTotalStakedOGY(_totalStakedOGY);
    }
  }, [isSuccess, _totalStakedRewardsOGY, _totalStakedOGY]);

  const rows = isSuccess
    ? neurons?.map((neuron, index) => {
        const claimAmount = neuronClaimBalance[index]?.data?.balance;
        const id2Hex = neuron?.id2Hex;
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
        return {
          id: id2Hex,
          stakedAmount,
          claimAmount,
          state,
          votingPower,
          dissolveDelay,
          age,
          stakedOGY,
          maturity: stakedMaturity,
          tableDetails: [
            { id: "", label: "Date Created", value: createdAt },
            {
              id: "",
              label: "Dissolve Delay Bonus",
              value: dissolveDelayBonus,
            },
            { id: "", label: "Age Bonus", value: ageBonus },
            { id: "", label: "Total Bonus", value: maxAgeBonusPercentage },
          ],
          tableAccountDetails: [
            {
              id: "state",
              label: "State",
              value: neuron.state,
            },
            {
              id: "votingPower",
              label: "Voting power",
              value: neuron.votingPowerToString,
            },
            {
              id: "dissolveDelay",
              label: "Dissolve delay",
              value: neuron.dissolveDelay,
            },
            {
              id: "age",
              label: "Age",
              value: neuron.ageToRelativeCalendar,
            },
          ],
        };
      })
    : [];

  return {
    stakedRewardsOGY: {
      totalStakedRewardsOGY,
      string: {
        totalStakedRewardsOGY: roundAndFormatLocale({
          number: _totalStakedRewardsOGY,
        }),
      },
      neuronIds: neurons?.map((neuron) => neuron.id2Hex) ?? [],
    },
    stakedOGY: {
      totalStakedOGY,
      string: {
        totalStakedOGY: roundAndFormatLocale({
          number: _totalStakedOGY,
        }),
      },
    },
    neuronsList: { rows, rowCount: rows?.length ?? 0 },
    isLoading:
      isLoadingListNeurons ||
      isLoadingGetNervousSystemParameters ||
      neuronClaimBalance.some((query) => query.isLoading),
    isSuccess,
    isError:
      isErrorListNeurons ||
      isErrorGetNervousSystemParameters ||
      neuronClaimBalance.some((query) => query.isError),
    error:
      errorListNeurons ||
      errorGetNervousSystemParameters ||
      neuronClaimBalance.map((query) => query.error).filter(Boolean)[0],
  };
};

export default useNeuronsOwner;
