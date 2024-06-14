import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import {
  getCurrentTimestamp,
  formatTimestampDifference,
  formatYearsDifference,
  formatDate,
} from "@helpers/dates";
import { ISystemNervousParametersResponse } from "@services/queries/governance/neurons/useGetNervousSystemParameters";
import { INeuronResult, INeuronData, IDissolveState } from "@services/types";
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;

const getDissolveDelaySeconds = (dissolveState: IDissolveState): number => {
  if (
    dissolveState?.DissolveDelaySeconds === undefined &&
    dissolveState.WhenDissolvedTimestampSeconds === undefined
  )
    return 0;
  return dissolveState?.DissolveDelaySeconds !== undefined
    ? Number(dissolveState.DissolveDelaySeconds)
    : Number(dissolveState.WhenDissolvedTimestampSeconds) -
        getCurrentTimestamp();
};

const getIsDissolved = (dissolveState: IDissolveState) => {
  if (
    dissolveState.DissolveDelaySeconds !== undefined &&
    dissolveState.DissolveDelaySeconds !== 0
  )
    return false;
  return true;
};

const getNeuronState = (dissolveState: IDissolveState) => {
  if (getIsDissolved(dissolveState)) return "Dissolved";
  return "Not dissolving";
  // if (
  //   dissolveState.DissolveDelaySeconds !== undefined &&
  //   dissolveState.DissolveDelaySeconds !== 0
  // )
  //   return "Not dissolving";
  // if (
  //   dissolveState.WhenDissolvedTimestampSeconds !== undefined &&
  //   dissolveState.WhenDissolvedTimestampSeconds > getCurrentTimestamp()
  // )
  //   return "Dissolving";
  // return "Dissolved";
};

const getNeuronData = (
  data: INeuronResult,
  nervousSystemParameters?: ISystemNervousParametersResponse
) => {
  const dissolveState = Array.isArray(data.dissolve_state)
    ? data.dissolve_state[0]
    : data.dissolve_state;
  const stakedMaturityEquivalent = Array.isArray(
    data.staked_maturity_e8s_equivalent
  )
    ? data.staked_maturity_e8s_equivalent[0]
    : data.staked_maturity_e8s_equivalent;
  const id = Array.isArray(data.id)
    ? Buffer.from(data.id[0].id).toString("hex")
    : data.id;

  const currentTimestamp = getCurrentTimestamp();
  // const cachedNeuronStakeE8s = Number(data?.cached_neuron_stake_e8s);
  const createdAt = Number(data.created_timestamp_seconds);
  const age =
    Date.now() / 1000 -
    (getCurrentTimestamp() - Number(data.aging_since_timestamp_seconds));
  const maxNeuronAgeForAgeBonus = Number(
    nervousSystemParameters?.maxNeuronAgeForAgeBonus ?? 0
  );
  const maxAgeBonusPercentage = Number(
    nervousSystemParameters?.maxAgeBonusPercentage ?? 0
  );
  const ageBonus = !getIsDissolved(dissolveState)
    ? ((age / maxNeuronAgeForAgeBonus) * maxAgeBonusPercentage) / 100
    : 0;

  // const dissolveDelay = dissolveState?.DissolveDelaySeconds
  // ? currentTimestamp + Number(dissolveState.DissolveDelaySeconds) || 0
  // : Number(dissolveState.WhenDissolvedTimestampSeconds) -
  //     currentTimestamp || 0;
  const dissolveDelay = !getIsDissolved(dissolveState)
    ? currentTimestamp + Number(dissolveState.DissolveDelaySeconds)
    : 0;
  const maxDissolveDelayBonusPercentage =
    nervousSystemParameters?.maxDissolveDelayBonusPercentage ?? 0;
  const maxDissolveDelaySeconds =
    nervousSystemParameters?.maxDissolveDelaySeconds ?? 0;

  const neuronMinimumDissolveDelayToVoteSeconds =
    nervousSystemParameters?.neuronMinimumDissolveDelayToVoteSeconds ?? 0;

  const dissolveDelaySeconds = getDissolveDelaySeconds(dissolveState);

  const dissolveDelayBonus =
    dissolveDelaySeconds >= neuronMinimumDissolveDelayToVoteSeconds
      ? (dissolveDelaySeconds / maxDissolveDelaySeconds) *
        maxDissolveDelayBonusPercentage
      : 0;

  const stakedAmount = divideBy1e8(Number(data.cached_neuron_stake_e8s || 0));

  const stakedMaturity = divideBy1e8(
    Number(
      stakedMaturityEquivalent !== (null || undefined)
        ? stakedMaturityEquivalent
        : 0
    )
  );
  const autoStakeMaturity = data.auto_stake_maturity ? "true" : "false";

  const votingPower =
    dissolveDelaySeconds >= neuronMinimumDissolveDelayToVoteSeconds
      ? (stakedAmount + stakedMaturity) *
        (1 +
          ageBonus +
          (1 +
            dissolveDelaySeconds /
              (maxDissolveDelaySeconds *
                maxDissolveDelayBonusPercentage *
                10000)))
      : 0;

  const state = getNeuronState(dissolveState);

  return {
    id,
    stakedAmount,
    stakedMaturity,
    stakedAmountToString: roundAndFormatLocale({
      number: stakedAmount,
      decimals: 3,
    }),
    stakedMaturityToString: roundAndFormatLocale({
      number: stakedMaturity,
      decimals: 1,
    }),
    age,
    ageToRelativeCalendar: dissolveDelay ? formatTimestampDifference(age) : "-",
    state,
    votingPower,
    votingPowerToString: votingPower
      ? roundAndFormatLocale({
          number: votingPower,
          decimals: 0,
        })
      : "-",
    dissolveDelay: dissolveDelay ? formatYearsDifference(dissolveDelay) : "-",
    createdAt: formatDate(createdAt, { fromSeconds: true }) ?? "-",
    maxNeuronAgeForAgeBonus,
    maxAgeBonusPercentage: `${dissolveDelayBonus.toFixed(0)} %`,
    ageBonus,
    dissolveDelayBonus: `${dissolveDelayBonus.toFixed(0)} %`,
    autoStakeMaturity,
  } as INeuronData;
};

export default getNeuronData;
