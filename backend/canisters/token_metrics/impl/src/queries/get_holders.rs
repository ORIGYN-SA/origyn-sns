use crate::state::{with_merged_wallets_list, with_wallets_list};
use ic_cdk_macros::query;
use icrc_ledger_types::icrc1::account::Account;
pub use token_metrics_api::queries::get_holders::{
    Args as GetHoldersArgs, Response as GetHoldersResponse,
};
use token_metrics_api::token_data::WalletOverview;

#[query]
fn get_holders(args: GetHoldersArgs) -> GetHoldersResponse {
    let mut list: Vec<(Account, WalletOverview)> = if args.merge_accounts_to_principals {
        with_merged_wallets_list(|m| {
            m.iter()
                .map(|e| (Account::from(*e.key()), e.value()))
                .collect()
        })
    } else {
        with_wallets_list(|m| {
            m.iter()
                .map(|e| (Account::from(*e.key()), e.value()))
                .collect()
        })
    };

    list.sort_by(|a, b| b.1.total.cmp(&a.1.total));

    let total_count = list.len();
    let start = args.offset as usize;
    if start >= total_count {
        return GetHoldersResponse {
            data: Vec::new(),
            current_offset: args.offset,
            limit: args.limit,
            total_count,
        };
    }
    let end = (start + args.limit as usize).min(total_count);

    GetHoldersResponse {
        data: list[start..end]
            .iter()
            .map(|(account, wallet)| (*account, wallet.clone().into()))
            .collect(),
        current_offset: args.offset,
        limit: args.limit,
        total_count,
    }
}
