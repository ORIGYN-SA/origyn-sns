use candid::CandidType;
use serde::Deserialize;

use crate::token_data::LockedNeuronsAmountResponse;

#[derive(Deserialize, CandidType)]
pub struct LockedNeuronsPeriodResponse {
    pub amount: LockedNeuronsAmountResponse,
    pub count: LockedNeuronsAmountResponse,
}

pub type Args = ();
pub type Response = LockedNeuronsPeriodResponse;
