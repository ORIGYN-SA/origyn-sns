import { useState, useEffect } from "react";
import { useQueries, useQuery, keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import { getNeuronsByOwner } from "@services/sns-rewards/useGetNeuronsByOwner";
import { getNervousSystemParameters } from "@services/governance/useGetNervousSystemParameters";
import { fetchBalanceOGY } from "@services/accounts/fetchBalanceOGY";
import useFetchPriceOGY from "@services/accounts/fetchPriceOGY";
import { getNeuron, INeuronData } from "@services/governance/getNeuron";
import { SNS_REWARDS_CANISTER_ID } from "@constants/index";
import { roundAndFormatLocale } from "@helpers/numbers";

const useNeurons = () => {
  const { isConnected } = useConnect();
  const [snsRewardsActor] = useCanister("SNSRewards");
  const [governanceActor] = useCanister("governance");
  const [ledgerActor] = useCanister("ledger");

  const {
    data: neuronsByOwner,
    isSuccess: isSuccessGetNeuronsByOwner,
    isError: isErrorGetNeuronsByOwner,
    isLoading: isLoadingGetNeuronsByOwner,
    error: errorGetNeuronsByOwner,
  } = useQuery({
    queryKey: ["getNeuronsByOwner", isConnected],
    queryFn: () => getNeuronsByOwner({ snsRewardsActor }),
    enabled: !!isConnected,
  });

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
    data: priceOGY,
    isSuccess: isSuccessFetchPriceOGY,
    isError: isErrorFetchPriceOGY,
    isLoading: isLoadingFetchPriceOGY,
    error: errorFetchPriceOGY,
  } = useQuery(useFetchPriceOGY({ enabled: true }));

  const neuronDetailsResults = useQueries({
    queries:
      neuronsByOwner?.map((neuronId) => {
        return {
          queryKey: ["getNeuron", governanceActor, neuronId],
          queryFn: () =>
            getNeuron({
              governanceActor,
              neuronId: [neuronId],
              nervousSystemParameters,
            }),
          placeholderData: keepPreviousData,
          enabled:
            !!isSuccessGetNeuronsByOwner &&
            !!isSuccessGetNervousSystemParameters &&
            !!isSuccessFetchPriceOGY,
        };
      }) ?? [],
  });

  const neuronClaimBalanceResults = useQueries({
    queries:
      neuronsByOwner?.map((neuronId) => {
        return {
          queryKey: ["getNeuronClaimBalance", ledgerActor, neuronId],
          queryFn: () =>
            fetchBalanceOGY({
              actor: ledgerActor,
              owner: SNS_REWARDS_CANISTER_ID,
              subaccount: [neuronId?.id],
            }),
          enabled:
            !!isSuccessGetNeuronsByOwner &&
            !!isSuccessGetNervousSystemParameters &&
            !!isSuccessFetchPriceOGY,
        };
      }) ?? [],
  });

  const isSuccessGetNeuronsDetails =
    neuronDetailsResults.every((result) => result.isSuccess) &&
    neuronClaimBalanceResults.every((result) => result.isSuccess);

  const _totalStakedRewardsOGY = neuronClaimBalanceResults.reduce(
    (accumulator, currentValue) =>
      accumulator + (currentValue.data ? currentValue.data.balanceOGY : 0),
    0
  );
  const _totalStakedRewardsOGYUSD = neuronClaimBalanceResults.reduce(
    (accumulator, currentValue) =>
      accumulator +
      (currentValue.data
        ? currentValue.data.balanceOGY * priceOGY?.ogyPrice
        : 0),
    0
  );

  const [totalStakedRewardsOGY, setTotalStakedRewardsOGY] = useState(0);
  const [totalStakedRewardsOGYUSD, setTotalStakedRewardsOGYUSD] = useState(0);

  const _totalStakedOGY = neuronDetailsResults.reduce(
    (accumulator, currentValue) =>
      accumulator +
      (currentValue.data ? (currentValue.data as INeuronData).stakedAmount : 0),
    0
  );
  const _totalStakedOGYUSD = neuronDetailsResults.reduce(
    (accumulator, currentValue) =>
      accumulator +
      (currentValue.data
        ? (currentValue.data as INeuronData).stakedAmount * priceOGY?.ogyPrice
        : 0),
    0
  );

  const [totalStakedOGY, setTotalStakedOGY] = useState("0");
  const [totalStakedOGYUSD, setTotalStakedOGYUSD] = useState(0);

  useEffect(() => {
    if (isSuccessGetNeuronsDetails) {
      setTotalStakedRewardsOGY(_totalStakedRewardsOGY);
      setTotalStakedRewardsOGYUSD(_totalStakedRewardsOGYUSD);
      setTotalStakedOGY(roundAndFormatLocale({ number: _totalStakedOGY }));
      setTotalStakedOGYUSD(_totalStakedOGYUSD);
    }
  }, [
    isSuccessGetNeuronsDetails,
    _totalStakedRewardsOGY,
    _totalStakedRewardsOGYUSD,
    _totalStakedOGY,
    _totalStakedOGYUSD,
    neuronsByOwner,
  ]);

  const rows = isSuccessGetNeuronsDetails
    ? neuronsByOwner?.map((neuron, index) => {
        const neuronDetails = neuronDetailsResults[index]?.data as INeuronData;
        const claimAmount = neuronClaimBalanceResults[index]?.data?.balanceOGY;
        const neuronId = Buffer.from(neuron?.id).toString("hex");

        return {
          id: neuronId,
          stakedAmount: neuronDetails.stakedAmountToString,
          claimAmount,
          details: [
            {
              id: "state",
              label: "State",
              value: neuronDetails.state,
            },
            {
              id: "votingPower",
              label: "Voting power",
              value: neuronDetails.votingPowerToString,
            },
            {
              id: "dissolveDelay",
              label: "Dissolve delay",
              value: neuronDetails.dissolveDelay,
            },
            {
              id: "age",
              label: "Age",
              value: neuronDetails.ageToRelativeCalendar,
            },
          ],
        };
      })
    : [];

  return {
    stakedRewardsOGY: {
      totalStakedRewardsOGY,
      totalStakedRewardsOGYUSD,
      neuronIds: neuronsByOwner,
    },
    stakedOGY: {
      totalStakedOGY,
      totalStakedOGYUSD,
    },
    neuronsList: { rows, rowCount: rows?.length ?? 0 },
    isLoading:
      isLoadingGetNeuronsByOwner ||
      isLoadingGetNervousSystemParameters ||
      isLoadingFetchPriceOGY ||
      neuronDetailsResults.some((query) => query.isLoading) ||
      neuronClaimBalanceResults.some((query) => query.isLoading),
    isSuccess:
      neuronDetailsResults.every((query) => query.isSuccess) &&
      neuronClaimBalanceResults.every((query) => query.isSuccess),
    isError:
      isErrorGetNeuronsByOwner ||
      isErrorGetNervousSystemParameters ||
      isErrorFetchPriceOGY ||
      neuronDetailsResults.some((query) => query.isError) ||
      neuronClaimBalanceResults.some((query) => query.isError),
    error:
      errorGetNeuronsByOwner ||
      errorGetNervousSystemParameters ||
      errorFetchPriceOGY ||
      [...neuronDetailsResults, ...neuronClaimBalanceResults]
        .map((query) => query.error)
        .filter(Boolean)[0],
  };
};

export default useNeurons;
