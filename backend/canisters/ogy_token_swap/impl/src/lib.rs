use ic_cdk::export_candid;
use lifecycle::Args;
use types::{HttpRequest, HttpResponse};
// use updates::remove_swap_entry::RemoveSwapEntryRequest;
use updates::swap_tokens::{SwapTokensRequest, SwapTokensResponse};

mod guards;
mod jobs;
mod lifecycle;
mod memory;
mod model;
mod queries;
mod state;
mod updates;

export_candid!();
