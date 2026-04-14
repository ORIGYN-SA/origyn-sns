use crate::utils::{aggregate_overviews_by_principal, paginate_sorted};
use ic_cdk_macros::query;
use token_metrics_api::types::ledger_indexer::{GetPrincipalHoldersArgs, HolderBalanceResponseCompat};

#[query]
fn get_principal_holders(args: GetPrincipalHoldersArgs) -> Vec<HolderBalanceResponseCompat> {
    paginate_sorted(aggregate_overviews_by_principal(), args.offset, args.limit)
        .into_iter()
        .map(Into::into)
        .collect()
}
