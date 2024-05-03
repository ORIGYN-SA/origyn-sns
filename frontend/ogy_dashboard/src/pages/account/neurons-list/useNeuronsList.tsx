import { useQueries, keepPreviousData } from "@tanstack/react-query";
import { useConnect, useCanister } from "@connect2ic/react";
import { getNeuronsByOwner } from "@services/sns-rewards/useGetNeuronsByOwner";
import { getNervousSystemParameters } from "@services/governance/useGetNervousSystemParameters";
import { getNeuron } from "@services/governance/getNeuron";
import { getCurrentTimestamp } from "@helpers/dates";
import { DateTime } from "luxon";

export const neuronState = (dissolveState) => {
  let state;
  const currentTimestampSeconds = new Date().getTime() / 1000;
  if (dissolveState.DissolveDelaySeconds) {
    state = "Not dissolving";
  } else if (
    dissolveState.WhenDissolvedTimestampSeconds > currentTimestampSeconds
  ) {
    state = "Dissolving";
  } else {
    state = "Dissolved";
  }
  return state;
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

  const queryResults = useQueries({
    queries: [
      {
        queryKey: ["getNeuronsByOwner", isConnected],
        queryFn: () => getNeuronsByOwner({ snsRewardsActor }),
        enabled: !!isConnected,
      },
      {
        queryKey: ["getNervousSystemParameters", governanceActor, isConnected],
        queryFn: () => getNervousSystemParameters({ governanceActor }),
        enabled: !!isConnected,
      },
    ],
  });

  const neuronIds = queryResults[0]?.data || [];
  const isSuccessGetNeuronsByOwner = queryResults[0]?.isSuccess;
  const neuronsParameters = queryResults[1]?.data;

  const neuronDetailsResults = useQueries({
    queries: neuronIds
      ? neuronIds.map((neuronId) => {
          return {
            queryKey: ["getNeuron", governanceActor, neuronId],
            queryFn: () => getNeuron({ governanceActor, neuronId }),
            placeholderData: keepPreviousData,
            enabled: !!isSuccessGetNeuronsByOwner,
          };
        })
      : [],
  });

  const rows = neuronDetailsResults.every((result) => result.isSuccess)
    ? neuronDetailsResults.map((result, index) => {
        const status = result.data;
        const neuronId = Buffer.from(neuronIds[index][0].id).toString("hex");
        const neuronAge =
          Math.round(Date.now()) -
          Number(status.result[0].Neuron.aging_since_timestamp_seconds);
        const dissolveState = status.result[0].Neuron.dissolve_state[0];
        const { votingPower, dissolveDelay } = calculateVotingPower({
          cachedNeuronStakeE8s: Number(
            status.result[0].Neuron.cached_neuron_stake_e8s
          ),
          stakedMaturiryE8sEquivalent: Number(
            status.result[0].Neuron.staked_maturity_e8s_equivalent[0] || 0
          ),
          age: neuronAge,
          maxNeuronAgeForAgeBonus: Number(
            neuronsParameters.max_neuron_age_for_age_bonus[0]
          ),
          maxAgeBonusPercentage: Number(
            neuronsParameters.max_age_bonus_percentage[0]
          ),
          dissolveState,
          maxDissolveDelayBonusPercentage: Number(
            neuronsParameters.max_dissolve_delay_bonus_percentage[0]
          ),
          maxDissolveDelaySeconds: Number(
            neuronsParameters.max_dissolve_delay_seconds[0]
          ),
        });

        return {
          id: neuronId,
          votingPower,
          details: [
            { id: "state", label: "State", value: neuronState(dissolveState) },
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
      })
    : [];

  return {
    data: { rows, rowCount: rows.length },
    isLoading:
      queryResults.some((query) => query.isLoading) ||
      neuronDetailsResults.some((query) => query.isLoading),
    isSuccess: neuronDetailsResults.every((query) => query.isSuccess),
    isError:
      queryResults.some((query) => query.isError) ||
      neuronDetailsResults.some((query) => query.isError),
    errors: [...queryResults, ...neuronDetailsResults]
      .map((query) => query.error)
      .filter(Boolean),
  };
};

export default useNeuronsList;
