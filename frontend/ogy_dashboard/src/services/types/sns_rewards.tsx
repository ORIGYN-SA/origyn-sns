import type { Principal } from "@dfinity/principal";
export interface Args {
  token: string;
  neuron_id: NeuronId;
}
export interface Args_1 {
  transfer_amounts: Array<[string, bigint]>;
}
export interface Args_2 {
  token_list: Array<[string, TokenInfo]>;
}
export interface InitArgs {
  sns_gov_canister_id: Principal;
  test_mode: boolean;
  sns_ledger_canister_id: Principal;
}
export interface NeuronId {
  id: Array<number>;
}
export type Response =
  | { Ok: NeuronId }
  | { NeuronHotKeyAbsent: null }
  | { NeuronOwnerInvalid: [] | [Principal] }
  | { NeuronHotKeyInvalid: null }
  | { NeuronDoesNotExist: null }
  | { InternalError: string };
export type Response_1 =
  | { Ok: boolean }
  | { NeuronHotKeyAbsent: null }
  | { TokenSymbolInvalid: string }
  | { NeuronNotClaimed: null }
  | { NeuronOwnerInvalid: [] | [Principal] }
  | { NeuronHotKeyInvalid: null }
  | { TransferFailed: string }
  | { NeuronDoesNotExist: null }
  | { InternalError: string };
export type Response_2 =
  | { Ok: NeuronId }
  | { NeuronHotKeyAbsent: null }
  | { NeuronNotClaimed: null }
  | { NeuronOwnerInvalid: [] | [Principal] }
  | { NeuronHotKeyInvalid: null }
  | { NeuronDoesNotExist: null }
  | { InternalError: string };
export type Response_3 = { Success: null } | { InternalError: string };
export type Response_4 = { Success: null } | { InternalError: string };
export interface TokenInfo {
  fee: bigint;
  decimals: bigint;
  ledger_id: Principal;
}
export default interface _SERVICE {
  add_neuron_ownership: (arg_0: NeuronId) => Promise<Response>;
  claim_reward: (arg_0: Args) => Promise<Response_1>;
  get_neurons_by_owner: () => Promise<[] | [Array<NeuronId>]>;
  remove_neuron_ownership: (arg_0: NeuronId) => Promise<Response_2>;
  set_daily_ogy_burn_rate: (arg_0: bigint) => Promise<Response_3>;
  set_reserve_transfer_amounts: (arg_0: Args_1) => Promise<Response_3>;
  set_reward_token_types: (arg_0: Args_2) => Promise<Response_4>;
}
