use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

pub type Args = RemoveItemPriceArgs;
pub type Response = ();

/// Clears a collection's admin-configured USD-per-item price. Once removed,
/// the claimlink sync job stops valuing that collection until a new price is
/// set again.
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct RemoveItemPriceArgs {
    pub collection_canister_id: Principal,
}
