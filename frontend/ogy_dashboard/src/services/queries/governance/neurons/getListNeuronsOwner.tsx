import { ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { DateTime } from "luxon";
import { divideBy1e8, roundAndFormatLocale } from "@helpers/numbers";
import { getCurrentTimestamp } from "@helpers/dates";
import { ISystemNervousParametersResponse } from "@services/queries/governance/neurons/useGetNervousSystemParameters";
import {
  INeuronResultCanister,
  INeuronDataCanister as INeuronData,
  IDissolveState,
} from "@services/types";

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

export const getListNeuronsOwner = async ({
  governanceActor,
  owner,
  limit,
  neuronId,
  nervousSystemParameters,
}: {
  governanceActor: ActorSubclass;
  owner?: string;
  limit: number;
  neuronId?: string;
  nervousSystemParameters?: ISystemNervousParametersResponse | undefined;
}) => {
  const result = (await governanceActor.list_neurons({
    of_principal: owner ? [Principal.fromText(owner)] : [],
    limit,
    start_page_at: neuronId
      ? [{ id: [...Uint8Array.from(Buffer.from(neuronId, "hex"))] }]
      : [],
  })) as { neurons: INeuronResultCanister[] };

  const currentTimestamp = getCurrentTimestamp();

  return (
    result?.neurons?.map((data) => {
      const dissolveState = data.dissolve_state[0];
      // const cachedNeuronStakeE8s = Number(data?.cached_neuron_stake_e8s);
      const createdAt =
        Math.round(Date.now()) - Number(data?.created_timestamp_seconds);
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
        ? Number(dissolveState.DissolveDelaySeconds) || 0
        : Number(dissolveState.WhenDissolvedTimestampSeconds) -
            currentTimestamp || 0;
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
      const stakedAmount = divideBy1e8(
        Number(data.cached_neuron_stake_e8s || 0)
      );
      const stakedMaturity = divideBy1e8(
        Number(data.staked_maturity_e8s_equivalent[0] || 0)
      );
      const votingPower =
        (stakedAmount + stakedMaturity) *
        (1 + ageBonus) *
        (1 + dissolveDelayBonus);

      const state = getNeuronState(dissolveState);

      return {
        stakedAmount,
        stakedMaturity,
        stakedAmountToString: roundAndFormatLocale({ number: stakedAmount }),
        stakedMaturityToString: roundAndFormatLocale({
          number: stakedMaturity,
        }),
        age,
        ageToRelativeCalendar:
          DateTime.fromMillis(age).toRelativeCalendar() ?? "",
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
    }) ?? []
  );
};
