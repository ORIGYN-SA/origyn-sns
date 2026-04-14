use crate::utils::{collect_account_holders, paginate_sorted};
use ic_cdk_macros::query;
use token_metrics_api::types::ledger_indexer::{
    GetAccountHoldersArgs, HolderBalanceResponseCompat,
};

#[query]
fn get_account_holders(args: GetAccountHoldersArgs) -> Vec<HolderBalanceResponseCompat> {
    paginate_sorted(collect_account_holders(), args.offset, args.limit)
        .into_iter()
        .map(Into::into)
        .collect()
}
