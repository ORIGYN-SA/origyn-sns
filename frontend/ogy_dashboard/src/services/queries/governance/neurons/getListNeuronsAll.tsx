import { DateTime } from "luxon";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import { getCurrentTimestamp } from "@helpers/dates";
import { ISystemNervousParametersResponse } from "@services/queries/governance/neurons/useGetNervousSystemParameters";
import snsAPI from "@services/api/sns/v1";
import { SNS_ROOT_CANISTER } from "@constants/index";
import { INeuronResultAPI, INeuronData, IDissolveState } from "@services/types";

interface IGetListNeuronsAll {
  limit: number;
  offset: number;
  nervousSystemParameters?: ISystemNervousParametersResponse | undefined;
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

export const getListNeuronsAll = async ({
  limit = 10,
  offset = 0,
  nervousSystemParameters,
}: IGetListNeuronsAll) => {
  const {
    data,
  }: { data: { data: INeuronResultAPI[]; total_neurons: number } } =
    await snsAPI.get(
      `/snses/${SNS_ROOT_CANISTER}/neurons?offset=${offset}&limit=${limit}&sort_by=-created_timestamp_seconds`
    );

  const currentTimestamp = getCurrentTimestamp();

  return {
    totalNeurons: data.total_neurons,
    data:
      data?.data?.map((data) => {
        const dissolveState = data.dissolve_state;
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
        const ageBonus = dissolveState?.DissolveDelaySeconds
          ? ((age / maxNeuronAgeForAgeBonus) * maxAgeBonusPercentage) / 100
          : 0;
        const dissolveDelay = dissolveState?.DissolveDelaySeconds
          ? currentTimestamp + Number(dissolveState.DissolveDelaySeconds) || 0
          : Number(dissolveState.WhenDissolvedTimestampSeconds) -
              currentTimestamp || 0;
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
        const stakedAmount = divideBy1e8(
          Number(data.cached_neuron_stake_e8s || 0)
        );
        const stakedMaturity = divideBy1e8(
          Number(
            data.staked_maturity_e8s_equivalent !== null
              ? data.staked_maturity_e8s_equivalent[0]
              : 0
          )
        );
        const votingPower =
          (stakedAmount + stakedMaturity) *
          (1 + ageBonus) *
          (1 + dissolveDelayBonus);

        const state = getNeuronState(dissolveState);

        return {
          stakedAmount,
          stakedMaturity,
          stakedAmountToString: roundAndFormatLocale({
            number: stakedAmount,
            decimals: 3,
          }),
          stakedMaturityToString: roundAndFormatLocale({
            number: stakedMaturity,
          }),
          age,
          ageToRelativeCalendar:
            DateTime.fromSeconds(age).toRelativeCalendar() ?? "",
          state,
          votingPower,
          votingPowerToString: votingPower.toFixed(0),
          dissolveDelay: dissolveDelay
            ? DateTime.fromSeconds(dissolveDelay).toRelativeCalendar()
            : "-",
          id: data.id,
          createdAt: DateTime.fromSeconds(createdAt).toRelativeCalendar() ?? "",
          maxNeuronAgeForAgeBonus,
          maxAgeBonusPercentage,
          ageBonus,
          dissolveDelayBonus,
        } as INeuronData;
      }) ?? [],
  };
};
