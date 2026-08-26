use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};

pub type Args = SetItemPriceArgs;
pub type Response = ();

/// Sets (or replaces) the admin-configured USD-per-item price for a
/// collection's NFTs. The claimlink sync job multiplies this by the
/// collection's current `icrc7_total_supply` to derive its locked value.
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct SetItemPriceArgs {
    pub collection_canister_id: Principal,
    pub price_usd: u64,
}
