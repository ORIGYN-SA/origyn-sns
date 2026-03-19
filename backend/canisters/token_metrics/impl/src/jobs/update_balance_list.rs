use crate::state::{
    mutate_state, read_state, with_merged_wallets_list_mut, with_overviews, with_wallets_list_mut,
};
use crate::utils::account_to_text;
use bity_ic_canister_time::run_now_then_interval;
use icrc_ledger_types::icrc1::account::Account;
use std::collections::BTreeMap;
use std::collections::HashMap;
use std::time::Duration;
use token_metrics_api::token_data::{GovernanceStats, WalletOverview};
use token_metrics_api::types::ledger_indexer::{LedgerAccount, Overview as LedgerOverview};
use tracing::{debug, error, info, warn};
use types::Milliseconds;
use utils::principal::string_to_account;

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
        return;
    }

    let mut temp_wallets: BTreeMap<LedgerAccount, WalletOverview> = BTreeMap::new();
    let mut temp_merged: BTreeMap<LedgerAccount, WalletOverview> = BTreeMap::new();

    // Iterate through accounts
    for (wallet, stats) in account_holders_map.into_iter() {
        let new_stats = WalletOverview {
            ledger: stats.clone(),
            governance: GovernanceStats::default(),
            total: stats.balance as u128,
        };
        match string_to_account(wallet.clone()) {
            Ok(account) => {
                temp_wallets.insert(LedgerAccount::from(account), new_stats);
            }
            Err(err) => error!(err),
        }
    }

    // Iterate through principals
    for (wallet, stats) in principal_holders_map.into_iter() {
        let new_stats = WalletOverview {
            ledger: stats.clone(),
            governance: GovernanceStats::default(),
            total: stats.balance as u128,
        };
        match string_to_account(wallet.clone()) {
            Ok(account) => {
                let merged_key = LedgerAccount::from(Account {
                    owner: account.owner,
                    subaccount: None,
                });
                check_and_update_list(&mut temp_merged, merged_key, new_stats);
            }
            Err(err) => error!(err),
        }
    }

    // Going through all governance principals and appending their stats
    let governance_principals = read_state(|state| state.data.principal_gov_stats.clone());

    for (principal, gov_stats) in governance_principals {
        let new_stats = WalletOverview {
            ledger: LedgerOverview::default(),
            governance: gov_stats.clone(),
            total: gov_stats.total_staked,
        };
        let key = LedgerAccount::from(principal);
        check_and_update_list(&mut temp_merged, key, new_stats.clone());
        check_and_update_list(&mut temp_wallets, key, new_stats);
    }

    let treasury_account = read_state(|state| state.data.treasury_account.clone());

    // Fix up governance canister entry in merged list
    let governance_0_key =
        LedgerAccount::from(read_state(|state| state.data.sns_governance_canister));
    match string_to_account(treasury_account) {
        Ok(treasury) => {
            let treasury_key = LedgerAccount::from(treasury);
            match temp_wallets.get(&treasury_key) {
                Some(v) => {
                    temp_merged.insert(governance_0_key, v.clone());
                }
                None => {
                    temp_merged.insert(governance_0_key, WalletOverview::default());
                }
            }
        }
        Err(_) => {
            temp_merged.insert(governance_0_key, WalletOverview::default());
        }
    }

    // Write to stable memory maps (clear + rebuild)
    with_wallets_list_mut(|m| {
        m.clear_new();
        for (k, v) in &temp_wallets {
            m.insert(*k, v.clone());
        }
    });
    with_merged_wallets_list_mut(|m| {
        m.clear_new();
        for (k, v) in &temp_merged {
            m.insert(*k, v.clone());
        }
    });

    // Update active user counts
    let active_accounts = temp_wallets.values().filter(|w| w.total > 0).count();
    let active_principals = temp_merged.values().filter(|w| w.total > 0).count();
    mutate_state(|state| {
        state.data.active_users.active_accounts_count = active_accounts;
        state.data.active_users.active_principals_count = active_principals;
    });

    mutate_state(|state| state.data.update_foundation_accounts_data());
    info!("update_balance_list -> done, mutated the state")
}

/// Get all holders from the local ledger indexer's stable memory.
fn get_all_holders() -> (
    HashMap<String, LedgerOverview>,
    HashMap<String, LedgerOverview>,
) {
    info!("getting all holders from local indexer..");

    with_overviews(|m| {
        let mut principals: HashMap<String, LedgerOverview> = HashMap::new();
        let mut accounts: HashMap<String, LedgerOverview> = HashMap::new();

        for entry in m.iter() {
            let account = entry.key();
            let overview = entry.value();
            accounts.insert(account_to_text(account), overview);

            let principal_text = account.owner.to_text();
            principals
                .entry(principal_text)
                .and_modify(|agg| *agg = *agg + overview)
                .or_insert(overview);
        }

        (principals, accounts)
    })
}

fn check_and_update_list(
    list: &mut BTreeMap<LedgerAccount, WalletOverview>,
    key: LedgerAccount,
    new_value: WalletOverview,
) {
    match list.get(&key) {
        Some(list_value) => {
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
