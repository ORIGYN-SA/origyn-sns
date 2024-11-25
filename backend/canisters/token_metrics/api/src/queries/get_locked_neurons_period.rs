use candid::CandidType;
use serde::Deserialize;

use crate::token_data::LockedNeuronsAmount;

#[derive(Deserialize, CandidType)]
pub struct LockedNeuronsPeriodResponse {
    pub amount: LockedNeuronsAmount,
    pub count: LockedNeuronsAmount,
}

pub type Args = ();
pub type Response = LockedNeuronsPeriodResponse;
