import { DateTime } from "luxon";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import { getCurrentTimestamp } from "@helpers/dates";
import { ISystemNervousParametersResponse } from "@services/governance/useGetNervousSystemParameters";
import snsAPI from "@services/_api/sns/v1";
import { SNS_ROOT_CANISTER } from "@constants/index";

interface IListNeurons {
  neuronId: string;
  nervousSystemParameters?: ISystemNervousParametersResponse | undefined;
}

interface IDissolveState {
  DissolveDelaySeconds?: bigint;
  WhenDissolvedTimestampSeconds?: bigint;
}

// interface INeurons {
//   cached_neuron_stake_e8s: bigint;
//   staked_maturity_e8s_equivalent: bigint[];
//   aging_since_timestamp_seconds: bigint;
//   dissolve_state: IDissolveState;
//   id: string;
//   created_timestamp_seconds: bigint;
// }

// interface IListNeuronsResult {
//   data: INeurons;
// }

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
  id: string;
  id2Hex: string;
  createdAt: string;
  maxNeuronAgeForAgeBonus: number;
  maxAgeBonusPercentage: number;
  ageBonus: number;
  dissolveDelayBonus: number;
}

const getNeuronState = (dissolveState: IDissolveState) => {
  const currentTimestampSeconds = new Date().getTime() / 1000;
  if (dissolveState.DissolveDelaySeconds !== undefined) return "Not dissolving";
  if (
    dissolveState.WhenDissolvedTimestampSeconds !== undefined &&
    dissolveState.WhenDissolvedTimestampSeconds > currentTimestampSeconds
  )
    return "Dissolving";
  return "Dissolved";
};

export const getOneNeuronAll = async ({
  neuronId,
  nervousSystemParameters,
}: IListNeurons) => {
  const { data } = await snsAPI.get(
    `/snses/${SNS_ROOT_CANISTER}/neurons/${neuronId}`
  );

  const currentTimestamp = getCurrentTimestamp();
  const dissolveState = data.dissolve_state;
  // const cachedNeuronStakeE8s = Number(data?.cached_neuron_stake_e8s);
  const createdAt =
    Math.round(Date.now()) - Number(data.created_timestamp_seconds);
  const age =
    Math.round(Date.now()) - Number(data.aging_since_timestamp_seconds);
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
    ? Number(dissolveState.DissolveDelaySeconds !== undefined) || 0
    : Number(dissolveState.WhenDissolvedTimestampSeconds) - currentTimestamp ||
      0;
  const maxDissolveDelayBonusPercentage =
    nervousSystemParameters?.maxDissolveDelayBonusPercentage ?? 0;
  const maxDissolveDelaySeconds =
    nervousSystemParameters?.maxDissolveDelaySeconds ?? 0;
  const dissolveDelayBonus =
    dissolveState?.DissolveDelaySeconds !== undefined
      ? (Number(dissolveState.DissolveDelaySeconds) /
          (maxDissolveDelaySeconds * maxDissolveDelayBonusPercentage)) *
        100
      : ((Number(dissolveState.WhenDissolvedTimestampSeconds) -
          currentTimestamp) /
          (maxDissolveDelaySeconds * maxDissolveDelayBonusPercentage)) *
        100;
  const stakedAmount = divideBy1e8(Number(data.cached_neuron_stake_e8s || 0));
  const stakedMaturity = divideBy1e8(
    Number(
      data.staked_maturity_e8s_equivalent !== null
        ? data.staked_maturity_e8s_equivalent[0]
        : 0
    )
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
    id: data.id,
    createdAt: DateTime.fromMillis(createdAt).toRelativeCalendar() ?? "",
    maxNeuronAgeForAgeBonus,
    maxAgeBonusPercentage,
    ageBonus,
    dissolveDelayBonus,
  } as INeuronData;
};
