/* eslint-disable @typescript-eslint/no-unused-vars */
export const idlFactory = ({ IDL }) => {
  const InitArgs = IDL.Record({
    test_mode: IDL.Bool,
    ogy_new_ledger_canister_id: IDL.Principal,
    super_stats_canister_id: IDL.Principal,
    sns_governance_canister_id: IDL.Principal,
  });
  const GetHoldersArgs = IDL.Record({
    offset: IDL.Nat64,
    limit: IDL.Nat64,
    merge_accounts_to_principals: IDL.Bool,
  });
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const Overview = IDL.Record({
    balance: IDL.Nat,
    sent: IDL.Tuple(IDL.Nat32, IDL.Nat),
    last_active: IDL.Nat64,
    first_active: IDL.Nat64,
    received: IDL.Tuple(IDL.Nat32, IDL.Nat),
  });
  const GovernanceStats = IDL.Record({
    total_rewards: IDL.Nat,
    total_staked: IDL.Nat,
    total_locked: IDL.Nat,
    total_unlocked: IDL.Nat,
  });
  const WalletOverview = IDL.Record({
    total: IDL.Nat64,
    ledger: Overview,
    governance: GovernanceStats,
  });
  const TokenSupplyData = IDL.Record({
    circulating_supply: IDL.Nat,
    total_supply: IDL.Nat,
  });
  return IDL.Service({
    get_all_neuron_owners: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
    get_holders: IDL.Func(
      [GetHoldersArgs],
      [IDL.Vec(IDL.Tuple(Account, WalletOverview))],
      ["query"]
    ),
    get_neurons_stats: IDL.Func(
      [IDL.Opt(IDL.Principal)],
      [GovernanceStats],
      ["query"]
    ),
    get_supply_data: IDL.Func([], [TokenSupplyData], ["query"]),
  });
};
export const init = ({ IDL }) => {
  const InitArgs = IDL.Record({
    test_mode: IDL.Bool,
    ogy_new_ledger_canister_id: IDL.Principal,
    super_stats_canister_id: IDL.Principal,
    sns_governance_canister_id: IDL.Principal,
  });
  return [InitArgs];
};
