export interface IDissolveState {
  DissolveDelaySeconds?: number | bigint;
  WhenDissolvedTimestampSeconds?: number | bigint;
}

interface INeuronId {
  id: number[];
}

export interface INeuronResult {
  id: string | INeuronId | INeuronId[];
  cached_neuron_stake_e8s: number | bigint;
  staked_maturity_e8s_equivalent: number[] | bigint[];
  aging_since_timestamp_seconds: number | bigint;
  dissolve_state: IDissolveState | IDissolveState[];
  created_timestamp_seconds: number | bigint;
  vesting_period_seconds: number | bigint | null;
  auto_stake_maturity: number | bigint | null;
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
  dissolveDelay: string;
  id: string;
  createdAt: string;
  maxNeuronAgeForAgeBonus: number;
  maxAgeBonusPercentage: string;
  ageBonus: number;
  dissolveDelayBonus: string;
  vestingPeriod?: number | null;
  autoStakeMaturity?: number | null;
}
