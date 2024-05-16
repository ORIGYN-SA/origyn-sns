import type { Principal } from "@dfinity/principal";
export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Array<number>],
}
export interface GetHoldersArgs {
  'offset' : bigint,
  'limit' : bigint,
  'merge_accounts_to_principals' : boolean,
}
export interface GovernanceStats {
  'total_rewards' : bigint,
  'total_staked' : bigint,
  'total_locked' : bigint,
  'total_unlocked' : bigint,
}
export interface InitArgs {
  'test_mode' : boolean,
  'ogy_new_ledger_canister_id' : Principal,
  'super_stats_canister_id' : Principal,
  'sns_governance_canister_id' : Principal,
}
export interface Overview {
  'balance' : bigint,
  'sent' : [number, bigint],
  'last_active' : bigint,
  'first_active' : bigint,
  'received' : [number, bigint],
}
export interface TokenSupplyData {
  'circulating_supply' : bigint,
  'total_supply' : bigint,
}
export interface WalletOverview {
  'total' : bigint,
  'ledger' : Overview,
  'governance' : GovernanceStats,
}
export default interface _SERVICE {
  'get_all_neuron_owners' : () => Promise<Array<Principal>>,
  'get_holders' : (arg_0: GetHoldersArgs) => Promise<
      Array<[Account, WalletOverview]>
    >,
  'get_neurons_stats' : (arg_0: [] | [Principal]) => Promise<GovernanceStats>,
  'get_supply_data' : () => Promise<TokenSupplyData>,
}