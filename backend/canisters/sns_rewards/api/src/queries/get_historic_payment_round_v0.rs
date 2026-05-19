use candid::CandidType;
use serde::{Deserialize, Serialize};
use types::TokenSymbolV0;

use crate::payment_round::PaymentRoundV0;

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub struct Args {
    pub token: TokenSymbolV0,
    pub round_id: u16,
}

pub type Response = Vec<(u16, PaymentRoundV0)>;
