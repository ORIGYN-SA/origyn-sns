use bity_ic_canister_time::run_now_then_interval;
use utils::principal::string_to_account;
use std::collections::BTreeMap;
use icrc_ledger_types::icrc1::account::Account;
use token_metrics_api::types::ledger_indexer::Overview as LedgerOverview;
use token_metrics_api::token_data::{GovernanceStats, WalletOverview};
use std::collections::BTreeMap as NormalBTreeMap;
use std::collections::HashMap;
use std::time::Duration;
use tracing::{debug, error, info, warn};
use types::Milliseconds;
use crate::state::{mutate_state, read_state};

// every 12 hours
const UPDATE_LEDGER_BALANCE_LIST: Milliseconds = 12 * 60 * 60 * 1_000;

pub fn start_job() {
    info!("Starting the update ledger balance list job...");
    run_now_then_interval(Duration::from_millis(UPDATE_LEDGER_BALANCE_LIST), run);
}

pub fn run() {
    ic_cdk::futures::spawn(update_balance_list())
}

pub async fn update_balance_list() {
    debug!("update_balance_list");
    let (principal_holders_map, account_holders_map) = get_all_holders();

    if principal_holders_map.is_empty() && account_holders_map.is_empty() {
        warn!("Ledger indexer not yet populated — skipping balance list update");
    }

    let mut temp_wallets_list: NormalBTreeMap<Account, WalletOverview> = NormalBTreeMap::new();
    let mut temp_merged_wallets_list: NormalBTreeMap<
        Account,
        WalletOverview,
    > = NormalBTreeMap::new();

    // Iterate through accounts
    for (wallet, stats) in account_holders_map.into_iter() {
        let new_stats = WalletOverview {
            ledger: stats.clone(),
            governance: GovernanceStats::default(),
            total: stats.balance.clone() as u64,
        };
        match string_to_account(wallet.clone()) {
            Ok(account) => {
                // Insert the item in the list with all accounts
                temp_wallets_list.insert(account, new_stats.clone());
            }
            Err(err) => error!(err),
        }
    }
    // Iterate through principals
    for (wallet, stats) in principal_holders_map.into_iter() {
        let new_stats = WalletOverview {
            ledger: stats.clone(),
            governance: GovernanceStats::default(),
            total: stats.balance as u64,
        };
        match string_to_account(wallet.clone()) {
            Ok(account) => {
                // Update the merged list with the principal
                let merged_account_into_principal = Account {
                    owner: account.owner,
                    subaccount: None,
                };
                check_and_update_list(
                    &mut temp_merged_wallets_list,
                    merged_account_into_principal,
                    new_stats.clone(),
                );
            }
            Err(err) => error!(err),
        }
    }

    // Going through all governance principals and appending their stats
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

    let treasury_account = read_state(|state| state.data.treasury_account.clone());

    mutate_state(|state| {
        // Remove the first item from the merged array, which is the governance canister
        // including all stakes, also available in each principal.governance in the list
        // and then replace its value with the value of subbaccount 32x0
        let governance_0_account = Account {
            owner: state.data.sns_governance_canister,
            subaccount: None,
        };

        match string_to_account(treasury_account.to_string()) {
            Ok(treasury_account) => {
                match temp_wallets_list.get(&treasury_account) {
                    Some(v) => {
                        temp_merged_wallets_list.insert(governance_0_account, v.clone());
                    }
                    None => {
                        let default_overview = WalletOverview::default();
                        temp_merged_wallets_list.insert(governance_0_account, default_overview);
                    }
                }
            }
            Err(_) => {
                let default_overview = WalletOverview::default();
                temp_merged_wallets_list.insert(governance_0_account, default_overview);
            }
        }

        state.data.merged_wallets_list = sort_map_descending(&temp_merged_wallets_list);
        state.data.wallets_list = sort_map_descending(&temp_wallets_list);

        state.data.active_users.active_principals_count = count_active_users(
            &temp_merged_wallets_list,
        );
        state.data.active_users.active_accounts_count = count_active_users(&temp_wallets_list);
    });
    mutate_state(|state| state.data.update_foundation_accounts_data());
    info!("update_balance_list -> done, mutated the state")
}

/// Get all holders from the local ledger indexer's stable memory.
/// Returns (principal_holders, account_holders) as HashMaps keyed by text representation.
fn get_all_holders() -> (HashMap<String, LedgerOverview>, HashMap<String, LedgerOverview>) {
    info!("getting all holders from local indexer..");
    use candid::Principal;
    use crate::ledger_indexer::state::with_overviews;
    use crate::ledger_indexer::utils::account_to_text;

    // Build both maps in a single pass over the overviews
    let (principal_holders_map, account_holders_map) = with_overviews(|m| {
        let mut principals: HashMap<String, LedgerOverview> = HashMap::new();
        let mut accounts: HashMap<String, LedgerOverview> = HashMap::new();

        for entry in m.iter() {
            let account = entry.key();
            let overview = entry.value();
            // Account-level: use full "principal.subaccount" text
            accounts.insert(account_to_text(account), overview.clone());

            // Principal-level: group by owner
            let principal_text = account.owner.to_text();
            principals
                .entry(principal_text)
                .and_modify(|agg| *agg = *agg + overview)
                .or_insert(overview);
        }

        (principals, accounts)
    });

    (principal_holders_map, account_holders_map)
}

fn check_and_update_list(
    list: &mut NormalBTreeMap<Account, WalletOverview>,
    key: Account,
    new_value: WalletOverview,
) {
    match list.get(&key) {
        Some(list_value) => {
            // wallet already in the list
            let updated_value = WalletOverview {
                ledger: list_value.ledger + new_value.ledger,
                governance: list_value.governance.clone() + new_value.governance,
                total: list_value.total + new_value.total,
            };
            list.insert(key, updated_value);
        }
        None => {
            list.insert(key, new_value);
        }
    }
}

fn count_active_users(list: &BTreeMap<Account, WalletOverview>) -> usize {
    list.values()
        .filter(|wallet| wallet.total > 0)
        .count()
}
fn sort_map_descending(
    map: &NormalBTreeMap<Account, WalletOverview>,
) -> Vec<(Account, WalletOverview)> {
    let mut vec: Vec<(Account, WalletOverview)> = map
        .iter()
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();

    vec.sort_by(|a, b| b.1.total.cmp(&a.1.total));

    vec
}
