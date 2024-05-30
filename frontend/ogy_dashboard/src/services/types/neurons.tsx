export interface IDissolveState {
  DissolveDelaySeconds?: number | bigint;
  WhenDissolvedTimestampSeconds?: number | bigint;
}

interface INeuronId {
  id: number[];
}

export interface INeuronResultAPI {
  id: string | INeuronId | INeuronId[];
  cached_neuron_stake_e8s: number;
  staked_maturity_e8s_equivalent: number[];
  aging_since_timestamp_seconds: number;
  dissolve_state: IDissolveState;
  created_timestamp_seconds: number;
  vesting_period_seconds: number | null;
  auto_stake_maturity: number | null;
}

export interface INeuronResultCanister {
  id: INeuronId[];
  cached_neuron_stake_e8s: bigint;
  staked_maturity_e8s_equivalent: bigint[];
  aging_since_timestamp_seconds: bigint;
  dissolve_state: IDissolveState[];
  created_timestamp_seconds: bigint;
  vesting_period_seconds: bigint;
  auto_stake_maturity: bigint;
}

// export interface INeuronResults {
//   data: INeuronResult[];
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
  dissolveDelay: string;
  id: string;
  id2Hex: string;
  createdAt: string;
  maxNeuronAgeForAgeBonus: number;
  maxAgeBonusPercentage: number;
  ageBonus: number;
  dissolveDelayBonus: number;
  vestingPeriod?: number | null;
  autoStakeMaturity?: number | null;
}

export interface INeuronDataCanister {
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
  id: {
    id: number[];
  };
  id2Hex: string;
  createdAt: string;
  maxNeuronAgeForAgeBonus: number;
  maxAgeBonusPercentage: number;
  ageBonus: number;
  dissolveDelayBonus: number;
}
