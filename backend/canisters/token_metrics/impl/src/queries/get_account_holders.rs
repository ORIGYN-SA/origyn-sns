use crate::utils::{collect_account_holders, paginate_sorted};
use ic_cdk_macros::query;
pub use token_metrics_api::types::ledger_indexer::{GetAccountHoldersArgs, HolderBalanceResponse};

#[query]
fn get_account_holders(args: GetAccountHoldersArgs) -> Vec<HolderBalanceResponse> {
    paginate_sorted(collect_account_holders(), args.offset, args.limit)
}
