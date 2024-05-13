use ic_cdk_macros::query;
use icrc_ledger_types::icrc1::account::Account;

use crate::{ custom_types::GetHoldersArgs, state::{ read_state, WalletOverview } };

#[query]
fn get_holders(args: GetHoldersArgs) -> Vec<(Account, WalletOverview)> {
    let mut result = Vec::new();
    let mut current_offset = args.offset;
    let list = read_state(|state| {
        if args.merge_accounts_to_principals {
            state.data.merged_wallets_list.clone()
        } else {
            state.data.wallets_list.clone()
        }
    });
    for (key, value) in list.iter() {
        if current_offset > 0 {
            current_offset -= 1;
            continue;
        }

        if result.len() >= (args.limit as usize) {
            break;
        }

        result.push((key.clone(), value.clone()));
    }

    result
}
