import { useQueries, useQuery, keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import { getNeuronsByOwner } from "@services/sns-rewards/useGetNeuronsByOwner";
import { getNervousSystemParameters } from "@services/governance/useGetNervousSystemParameters";
import { fetchBalanceOGY } from "@services/accounts/fetchBalanceOGY";
import { getNeuron } from "@services/governance/getNeuron";
import { getCurrentTimestamp } from "@helpers/dates";
import { DateTime } from "luxon";
import { SNS_REWARDS_CANISTER_ID } from "@constants/index";
import { roundAndFormatLocale } from "@helpers/numbers";

export const neuronState = (dissolveState) => {
  const currentTimestampSeconds = new Date().getTime() / 1000;
  if (dissolveState.DissolveDelaySeconds) return "Not dissolving";
  if (dissolveState.WhenDissolvedTimestampSeconds > currentTimestampSeconds)
    return "Dissolving";
  return "Dissolved";
};

export const calculateVotingPower = (values) => {
  try {
    const {
      cachedNeuronStakeE8s,
      stakedMaturiryE8sEquivalent,
      age,
      maxNeuronAgeForAgeBonus,
      maxAgeBonusPercentage,
      maxDissolveDelaySeconds,
      dissolveState,
      maxDissolveDelayBonusPercentage,
    } = values;
    const stakedAmount = Number(cachedNeuronStakeE8s || 0) / 1e8;
    const stakedMaturity = Number(stakedMaturiryE8sEquivalent || 0) / 1e8;

    let ageBonus = 0;
    let dissolveDelayBonus = 0;
    let dissolveDelay = 0;
    const currentTimestamp = getCurrentTimestamp();

    if (dissolveState.DissolveDelaySeconds) {
      dissolveDelay = Number(dissolveState.DissolveDelaySeconds) || 0;
      ageBonus =
        ((age / Number(maxNeuronAgeForAgeBonus)) *
          Number(maxAgeBonusPercentage)) /
        100;
      dissolveDelayBonus =
        (Number(dissolveState.DissolveDelaySeconds) /
          (maxDissolveDelaySeconds * maxDissolveDelayBonusPercentage)) *
        100;
    } else {
      dissolveDelay =
        Number(dissolveState.WhenDissolvedTimestampSeconds) -
          currentTimestamp || 0;
      dissolveDelayBonus =
        ((Number(dissolveState.WhenDissolvedTimestampSeconds) -
          currentTimestamp) /
          (maxDissolveDelaySeconds * maxDissolveDelayBonusPercentage)) *
        100;
    }

    const votingPower =
      (stakedAmount + stakedMaturity) *
      (1 + ageBonus) *
      (1 + dissolveDelayBonus);

    return {
      votingPower:
        typeof votingPower.toFixed(2) === "string"
          ? votingPower.toFixed(2)
          : parseFloat(votingPower.toFixed(2)),
      ageBonus,
      dissolveDelayBonus,
      dissolveDelay,
    };
  } catch (error) {
    return 0;
  }
};

const useNeuronsList = () => {
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

  const neuronDetailsResults = useQueries({
    queries:
      neuronsByOwner?.map((neuronId) => {
        return {
          queryKey: ["getNeuron", governanceActor, neuronId],
          queryFn: () => getNeuron({ governanceActor, neuronId: [neuronId] }),
          placeholderData: keepPreviousData,
          enabled:
            !!isSuccessGetNeuronsByOwner && isSuccessGetNervousSystemParameters,
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
            !!isSuccessGetNeuronsByOwner && isSuccessGetNervousSystemParameters,
        };
      }) ?? [],
  });

  const isSuccessGetNeuronsDetails =
    neuronDetailsResults.every((result) => result.isSuccess) &&
    neuronClaimBalanceResults.every((result) => result.isSuccess);

  const neuronsDetails = neuronDetailsResults;
  const neuronsClaimBalance = neuronClaimBalanceResults;

  const rows =
    (isSuccessGetNeuronsDetails &&
      neuronsByOwner?.map((neuron, index) => {
        const status = neuronsDetails[index]?.data?.result[0];
        const claimAmount = neuronsClaimBalance[index]?.data?.balanceOGY;
        const neuronId = Buffer.from(neuron?.id).toString("hex");
        const neuronAge =
          Math.round(Date.now()) -
          Number(status.Neuron.aging_since_timestamp_seconds);
        const dissolveState = status.Neuron.dissolve_state[0];
        const { votingPower, dissolveDelay } = calculateVotingPower({
          cachedNeuronStakeE8s: Number(status.Neuron.cached_neuron_stake_e8s),
          stakedMaturiryE8sEquivalent: Number(
            status.Neuron.staked_maturity_e8s_equivalent[0] || 0
          ),
          age: neuronAge,
          maxNeuronAgeForAgeBonus:
            nervousSystemParameters?.maxNeuronAgeForAgeBonus,
          maxAgeBonusPercentage: nervousSystemParameters?.maxAgeBonusPercentage,
          dissolveState,
          maxDissolveDelayBonusPercentage:
            nervousSystemParameters?.maxDissolveDelayBonusPercentage,
          maxDissolveDelaySeconds:
            nervousSystemParameters?.maxDissolveDelaySeconds,
        });

        return {
          id: neuronId,
          votingPower: roundAndFormatLocale({ number: Number(votingPower) }),
          claimAmount,
          details: [
            {
              id: "state",
              label: "State",
              value: neuronState(dissolveState),
            },
            {
              id: "dissolveDelay",
              label: "Dissolve delay",
              value: dissolveDelay,
            },
            {
              id: "age",
              label: "Age",
              value: DateTime.fromMillis(neuronAge).toRelativeCalendar() || "",
            },
          ],
        };
      })) ??
    [];

  return {
    data: { rows, rowCount: rows.length },
    isLoading:
      isLoadingGetNeuronsByOwner ||
      isLoadingGetNervousSystemParameters ||
      neuronDetailsResults.some((query) => query.isLoading) ||
      neuronClaimBalanceResults.some((query) => query.isLoading),
    isSuccess:
      neuronDetailsResults.every((query) => query.isSuccess) &&
      neuronClaimBalanceResults.every((query) => query.isSuccess),
    isError:
      isErrorGetNeuronsByOwner ||
      isErrorGetNervousSystemParameters ||
      neuronDetailsResults.some((query) => query.isError) ||
      neuronClaimBalanceResults.some((query) => query.isError),
    error:
      errorGetNeuronsByOwner ||
      errorGetNervousSystemParameters ||
      [...neuronDetailsResults, ...neuronClaimBalanceResults]
        .map((query) => query.error)
        .filter(Boolean)[0],
  };
};

export default useNeuronsList;
