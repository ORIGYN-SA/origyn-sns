use canister_time::run_now_then_interval;
use icrc_ledger_types::icrc1::account::Account;
use super_stats_v3_c2c_client::{
    helpers::account_tree::Overview,
    queries::get_account_holders::GetHoldersArgs as GetAccountHoldersArgs,
    queries::get_principal_holders::GetHoldersArgs as GetPrincipalHoldersArgs,
};
use std::collections::BTreeMap as NormalBTreeMap;
use std::str::FromStr;
use std::{ collections::HashMap, time::Duration };
use tracing::{ debug, error, info };
use types::Milliseconds;
use crate::state::{ mutate_state, read_state, GovernanceStats, WalletOverview };
use super_stats_v3_c2c_client::helpers::account_tree::Overview as LedgerOverview;

const UPDATE_LEDGER_BALANCE_LIST: Milliseconds = 3_600 * 1_000;

pub fn start_job() {
    info!("Starting the update ledger balance list job...");
    run_now_then_interval(Duration::from_millis(UPDATE_LEDGER_BALANCE_LIST), run)
}

pub fn run() {
    ic_cdk::spawn(update_balance_list())
}

pub async fn update_balance_list() {
    debug!("update_balance_list");
    let (principal_holders_map, account_holders_map) = get_all_holders().await;
    let merged_holders: HashMap<String, Overview> = principal_holders_map
        .into_iter()
        .chain(account_holders_map.into_iter())
        .collect();

    let mut temp_wallets_list: NormalBTreeMap<Account, WalletOverview> = NormalBTreeMap::new();
    let mut temp_merged_wallets_list: NormalBTreeMap<
        Account,
        WalletOverview
    > = NormalBTreeMap::new();

    for (wallet, stats) in merged_holders.into_iter() {
        let new_stats = WalletOverview {
            ledger: stats,
            governance: GovernanceStats::default(),
            total: stats.balance as u64,
        };
        let account = Account::from_str(&wallet).unwrap();
        temp_wallets_list.insert(account, new_stats.clone());

        let account_merged_to_principal = Account {
            owner: account.owner,
            subaccount: None,
        };
        check_and_update_list(
            &mut temp_merged_wallets_list,
            account_merged_to_principal,
            new_stats.clone()
        );
    }

    // Going through all governance principals and apending their stats
    // to wallets_list and merged_wallets_list
    let governance_principals = read_state(|state| state.data.principal_gov_stats.clone());

    for (principal, gov_stats) in governance_principals {
        let total_staked = gov_stats.total_staked.0.clone().try_into().unwrap();
        let new_stats = WalletOverview {
            ledger: LedgerOverview::default(),
            governance: gov_stats,
            total: total_staked,
        };
        let account = Account::from(principal);
        check_and_update_list(&mut temp_merged_wallets_list, account, new_stats.clone());
        check_and_update_list(&mut temp_wallets_list, account, new_stats.clone());
    }

    mutate_state(|state| {
        state.data.wallets_list = sort_map_descending(&temp_wallets_list);
        state.data.merged_wallets_list = sort_map_descending(&temp_merged_wallets_list);
    });
    info!("update_balance_list -> done, mutated the state")
}

async fn get_all_holders() -> (HashMap<String, Overview>, HashMap<String, Overview>) {
    info!("getting all holders..");
    let super_stats_canister_id = read_state(|state| state.data.super_stats_canister);

    let mut principal_holders_map: HashMap<String, Overview> = HashMap::new();
    let mut account_holders_map: HashMap<String, Overview> = HashMap::new();

    let mut p_args = GetPrincipalHoldersArgs {
        offset: 0,
        limit: 100,
    };
    loop {
        match
            super_stats_v3_c2c_client::get_principal_holders(super_stats_canister_id, &p_args).await
        {
            Ok(principal_holders) => {
                for response in principal_holders.iter() {
                    principal_holders_map.insert(
                        response.holder.to_string(),
                        response.data.clone()
                    );
                }
                let count = principal_holders.len();
                if count < (p_args.limit as usize) {
                    break;
                } else {
                    p_args.offset += count as u64;
                }
            }
            Err(err) => {
                let message = format!("{err:?}");
                error!(message, "update_balance_list -> get_principal_holders");
            }
        }
    }

    let mut a_args = GetAccountHoldersArgs {
        offset: 0,
        limit: 100,
    };

    // Fetch account holders
    loop {
        match
            super_stats_v3_c2c_client::get_account_holders(super_stats_canister_id, &a_args).await
        {
            Ok(account_holders) => {
                for response in account_holders.iter() {
                    account_holders_map.insert(response.holder.clone(), response.data.clone());
                }

                let count = account_holders.len();
                if count < (a_args.limit as usize) {
                    break;
                } else {
                    a_args.offset += count as u64;
                }
            }
            Err(err) => {
                let message = format!("{err:?}");
                error!(message, "update_balance_list -> get_account_holders");
            }
        }
    }

    (principal_holders_map, account_holders_map)
}

fn check_and_update_list(
    list: &mut NormalBTreeMap<Account, WalletOverview>,
    key: Account,
    new_value: WalletOverview
) {
    match list.get(&key) {
        Some(list_value) => {
            // wallet already in the list
            let updated_value = WalletOverview {
                ledger: list_value.ledger + new_value.ledger,
                governance: list_value.governance + new_value.governance,
                total: list_value.total + new_value.total,
            };
            list.insert(key, updated_value);
        }
        None => {
            list.insert(key, new_value);
        }
    }
}

fn split_into_principal_and_account(input: String) -> (String, Option<String>) {
    if let Some(index) = input.find('.') {
        let (left, right) = input.split_at(index);
        let right = right.chars().skip(1).collect();
        (left.to_string(), Some(right))
    } else {
        (input, None)
    }
}

fn sort_map_descending(
    map: &NormalBTreeMap<Account, WalletOverview>
) -> Vec<(Account, WalletOverview)> {
    let mut vec: Vec<(Account, WalletOverview)> = map
        .iter()
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();

    vec.sort_by(|a, b| b.1.total.cmp(&a.1.total));

    vec
}
