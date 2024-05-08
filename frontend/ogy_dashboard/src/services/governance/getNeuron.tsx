// import { keepPreviousData } from "@tanstack/react-query";
// import { useConnect, useCanister } from "@connect2ic/react";
import { ActorSubclass } from "@dfinity/agent";
import { DateTime } from "luxon";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import { getCurrentTimestamp } from "@helpers/dates";
import { ISystemNervousParametersResponse } from "@services/governance/useGetNervousSystemParameters";

interface IGetNeuron {
  governanceActor: ActorSubclass;
  neuronId: object;
  nervousSystemParameters: ISystemNervousParametersResponse | undefined;
}

interface IDissolveState {
  DissolveDelaySeconds?: bigint;
  WhenDissolvedTimestampSeconds?: bigint;
}

interface INeuron {
  Neuron: {
    cached_neuron_stake_e8s: bigint;
    staked_maturity_e8s_equivalent: bigint[];
    aging_since_timestamp_seconds: bigint;
    dissolve_state: IDissolveState[];
  };
}

interface INeuronResult {
  result: INeuron[];
}

export interface INeuronData {
  stakedAmount: number;
  stakedAmountToString: string;
  age: number;
  ageToRelativeCalendar: string;
  state: string;
  votingPower: number;
  votingPowerToString: string;
  dissolveDelay: number;
}

const getNeuronState = (dissolveState: IDissolveState) => {
  const currentTimestampSeconds = new Date().getTime() / 1000;
  if (dissolveState.DissolveDelaySeconds) return "Not dissolving";
  if (
    dissolveState.WhenDissolvedTimestampSeconds &&
    dissolveState.WhenDissolvedTimestampSeconds > currentTimestampSeconds
  )
    return "Dissolving";
  return "Dissolved";
};

export const getNeuron = async ({
  governanceActor,
  neuronId,
  nervousSystemParameters,
}: IGetNeuron) => {
  const result = await governanceActor.get_neuron({
    neuron_id: neuronId,
  });
  const currentTimestamp = getCurrentTimestamp();
  const data = (result as INeuronResult)?.result[0]?.Neuron;
  const dissolveState = data?.dissolve_state[0];
  // const cachedNeuronStakeE8s = Number(data?.cached_neuron_stake_e8s);
  const age =
    Math.round(Date.now()) - Number(data?.aging_since_timestamp_seconds);
  const maxNeuronAgeForAgeBonus = Number(
    nervousSystemParameters?.maxNeuronAgeForAgeBonus ?? 0
  );
  const maxAgeBonusPercentage = Number(
    nervousSystemParameters?.maxAgeBonusPercentage ?? 0
  );
  const ageBonus = dissolveState?.DissolveDelaySeconds
    ? ((age / maxNeuronAgeForAgeBonus) * maxAgeBonusPercentage) / 100
    : 0;
  const dissolveDelay = dissolveState?.DissolveDelaySeconds
    ? Number(dissolveState.DissolveDelaySeconds) || 0
    : Number(dissolveState.WhenDissolvedTimestampSeconds) - currentTimestamp ||
      0;
  const maxDissolveDelayBonusPercentage =
    nervousSystemParameters?.maxDissolveDelayBonusPercentage ?? 0;
  const maxDissolveDelaySeconds =
    nervousSystemParameters?.maxDissolveDelaySeconds ?? 0;
  const dissolveDelayBonus = dissolveState?.DissolveDelaySeconds
    ? (Number(dissolveState.DissolveDelaySeconds) /
        (maxDissolveDelaySeconds * maxDissolveDelayBonusPercentage)) *
      100
    : ((Number(dissolveState.WhenDissolvedTimestampSeconds) -
        currentTimestamp) /
        (maxDissolveDelaySeconds * maxDissolveDelayBonusPercentage)) *
      100;
  const stakedAmount = divideBy1e8(Number(data?.cached_neuron_stake_e8s || 0));
  const stakedMaturity = divideBy1e8(
    Number(data?.staked_maturity_e8s_equivalent[0] || 0)
  );
  const votingPower =
    (stakedAmount + stakedMaturity) * (1 + ageBonus) * (1 + dissolveDelayBonus);

  const state = getNeuronState(dissolveState);

  return {
    stakedAmount,
    stakedAmountToString: roundAndFormatLocale({ number: stakedAmount }),
    age,
    ageToRelativeCalendar: DateTime.fromMillis(age).toRelativeCalendar() ?? "",
    state,
    votingPower,
    votingPowerToString: votingPower.toFixed(2),
    dissolveDelay,
  } as INeuronData;
};
