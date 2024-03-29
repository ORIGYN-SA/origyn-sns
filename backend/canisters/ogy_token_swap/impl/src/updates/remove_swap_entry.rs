// use candid::CandidType;
// use canister_tracing_macros::trace;
// use ic_cdk::update;
// use ic_ledger_types::BlockIndex;
// use serde::{Deserialize, Serialize};

// use crate::{guards::caller_is_authorised_principal, state::mutate_state};

// #[derive(CandidType, Serialize, Deserialize, Debug)]
// pub struct RemoveSwapEntryRequest {
//     block: BlockIndex,
// }

// #[trace]
// #[update(guard = "caller_is_authorised_principal")]
// async fn remove_swap_entry(args: RemoveSwapEntryRequest) {
//     remove_swap_entry_impl(args.block);
// }

// pub fn remove_swap_entry_impl(block: BlockIndex) -> String {
//     mutate_state(|s| s.data.token_swap.delete_entry(block))
// }
