// import { keepPreviousData } from "@tanstack/react-query";
// import { useConnect, useCanister } from "@connect2ic/react";
import { ActorSubclass } from "@dfinity/agent";
import { DateTime } from "luxon";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import { getCurrentTimestamp } from "@helpers/dates";
import { ISystemNervousParametersResponse } from "@services/queries/governance/useGetNervousSystemParameters";

interface INeuronId {
  id: number[];
}
interface IGetNeuron {
  governanceActor: ActorSubclass;
  neuronId: string;
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
    created_timestamp_seconds: bigint;
    id: INeuronId[];
  };
}

interface INeuronResult {
  result: INeuron[];
}

export interface INeuronData {
  stakedAmount: number;
  stakedMaturity: number;
  stakedAmountToString: string;
  stakedMaturityToString: string;
  age: number;
  ageToRelativeCalendar: string;
  state: string;
  votingPower: number;
  votingPowerToString: string;
  dissolveDelay: number;
  id: INeuronId;
  id2Hex: string;
  createdAt: string;
  maxNeuronAgeForAgeBonus: number;
  maxAgeBonusPercentage: number;
  ageBonus: number;
  dissolveDelayBonus: number;
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
    neuron_id: [{ id: [...Uint8Array.from(Buffer.from(neuronId, "hex"))] }],
  });

  const currentTimestamp = getCurrentTimestamp();
  const data = (result as INeuronResult)?.result[0]?.Neuron;
  const dissolveState = data?.dissolve_state[0];
  // const cachedNeuronStakeE8s = Number(data?.cached_neuron_stake_e8s);
  const createdAt =
    Math.round(Date.now()) - Number(data?.created_timestamp_seconds);
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
    stakedMaturity,
    stakedAmountToString: roundAndFormatLocale({ number: stakedAmount }),
    stakedMaturityToString: roundAndFormatLocale({
      number: stakedMaturity,
    }),
    age,
    ageToRelativeCalendar: DateTime.fromMillis(age).toRelativeCalendar() ?? "",
    state,
    votingPower,
    votingPowerToString: votingPower.toFixed(2),
    dissolveDelay,
    id: data.id[0],
    id2Hex: Buffer.from(data.id[0].id).toString("hex"),
    createdAt: DateTime.fromMillis(createdAt).toRelativeCalendar() ?? "",
    maxNeuronAgeForAgeBonus,
    maxAgeBonusPercentage,
    ageBonus,
    dissolveDelayBonus,
  } as INeuronData;
};
