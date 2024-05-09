import { useState, useEffect } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useCanister } from "@connect2ic/react";
import useConnect from "@helpers/useConnect";
// import { getNeuronsByOwner } from "@services/sns-rewards/useGetNeuronsByOwner";
import { getNervousSystemParameters } from "@services/governance/useGetNervousSystemParameters";
import { fetchBalanceOGY } from "@services/accounts/fetchBalanceOGY";
import useFetchPriceOGY from "@services/accounts/fetchPriceOGY";
// import { getNeuron, INeuronData } from "@services/governance/getNeuron";
import { listNeurons } from "@services/governance/listNeurons";
import { SNS_REWARDS_CANISTER_ID } from "@constants/index";
import { roundAndFormatLocale } from "@helpers/numbers";

const useNeurons = () => {
  const { isConnected, principal } = useConnect();
  // const [snsRewardsActor] = useCanister("SNSRewards");
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
    data: neurons,
    isSuccess: isSuccessListNeurons,
    isError: isErrorListNeurons,
    isLoading: isLoadingListNeurons,
    error: errorListNeurons,
  } = useQuery({
    queryKey: ["listNeurons", isConnected],
    queryFn: () =>
      listNeurons({
        governanceActor,
        owner: principal as string,
        nervousSystemParameters,
      }),
    enabled: !!isConnected && !!isSuccessGetNervousSystemParameters,
  });

  const {
    data: priceOGY,
    isSuccess: isSuccessFetchPriceOGY,
    isError: isErrorFetchPriceOGY,
    isLoading: isLoadingFetchPriceOGY,
    error: errorFetchPriceOGY,
  } = useQuery(useFetchPriceOGY({ enabled: true }));

  const neuronClaimBalance = useQueries({
    queries:
      neurons?.map(({ id: neuronId }) => {
        return {
          queryKey: ["getNeuronClaimBalance", ledgerActor, neuronId],
          queryFn: () =>
            fetchBalanceOGY({
              actor: ledgerActor,
              owner: SNS_REWARDS_CANISTER_ID,
              subaccount: neuronId.id,
            }),
          enabled: !!isSuccessListNeurons && !!isSuccessFetchPriceOGY,
        };
      }) ?? [],
  });

  const isSuccess = neuronClaimBalance.every((result) => result.isSuccess);

  const _totalStakedRewardsOGY = neuronClaimBalance.reduce(
    (accumulator, currentValue) =>
      accumulator + (currentValue.data ? currentValue.data.balanceOGY : 0),
    0
  );
  const _totalStakedRewardsOGYUSD = neuronClaimBalance.reduce(
    (accumulator, currentValue) =>
      accumulator +
      (currentValue.data
        ? currentValue.data.balanceOGY * priceOGY?.ogyPrice
        : 0),
    0
  );

  const [totalStakedRewardsOGY, setTotalStakedRewardsOGY] = useState(0);
  const [totalStakedRewardsOGYUSD, setTotalStakedRewardsOGYUSD] = useState(0);

  const _totalStakedOGY =
    neurons?.reduce(
      (accumulator, currentValue) =>
        accumulator + (currentValue ? currentValue.stakedAmount : 0),
      0
    ) ?? 0;
  const _totalStakedOGYUSD =
    neurons?.reduce(
      (accumulator, currentValue) =>
        accumulator +
        (currentValue ? currentValue.stakedAmount * priceOGY?.ogyPrice : 0),
      0
    ) ?? 0;

  const [totalStakedOGY, setTotalStakedOGY] = useState("0");
  const [totalStakedOGYUSD, setTotalStakedOGYUSD] = useState(0);

  useEffect(() => {
    if (isSuccess) {
      setTotalStakedRewardsOGY(_totalStakedRewardsOGY);
      setTotalStakedRewardsOGYUSD(_totalStakedRewardsOGYUSD);
      setTotalStakedOGY(roundAndFormatLocale({ number: _totalStakedOGY }));
      setTotalStakedOGYUSD(_totalStakedOGYUSD);
    }
  }, [
    isSuccess,
    _totalStakedRewardsOGY,
    _totalStakedRewardsOGYUSD,
    _totalStakedOGY,
    _totalStakedOGYUSD,
  ]);

  const rows = isSuccess
    ? neurons?.map((neuron, index) => {
        const claimAmount = neuronClaimBalance[index]?.data?.balanceOGY;
        return {
          id: neuron.id2Hex,
          stakedAmount: neuron.stakedAmountToString,
          claimAmount,
          details: [
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
      totalStakedRewardsOGYUSD,
      neuronIds: neurons?.map((neuron) => neuron.id) ?? [],
    },
    stakedOGY: {
      totalStakedOGY,
      totalStakedOGYUSD,
    },
    neuronsList: { rows, rowCount: rows?.length ?? 0 },
    isLoading:
      isLoadingListNeurons ||
      isLoadingGetNervousSystemParameters ||
      isLoadingFetchPriceOGY ||
      neuronClaimBalance.some((query) => query.isLoading),
    isSuccess,
    isError:
      isErrorListNeurons ||
      isErrorGetNervousSystemParameters ||
      isErrorFetchPriceOGY ||
      neuronClaimBalance.some((query) => query.isError),
    error:
      errorListNeurons ||
      errorGetNervousSystemParameters ||
      errorFetchPriceOGY ||
      neuronClaimBalance.map((query) => query.error).filter(Boolean)[0],
  };
};

export default useNeurons;
