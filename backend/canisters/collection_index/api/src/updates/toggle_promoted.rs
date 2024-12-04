use candid::{ CandidType, Principal };
use serde::{ Deserialize, Serialize };

use crate::errors::TogglePromotedError;
pub type Args = TogglePromotedArgs;
pub type Response = Result<(), TogglePromotedError>;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct TogglePromotedArgs {
    pub collection_canister_id: Principal,
}
