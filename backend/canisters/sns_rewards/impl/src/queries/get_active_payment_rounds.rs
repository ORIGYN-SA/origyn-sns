use crate::model::payment_processor::NeuronFlow;
use crate::state::read_state;
use ic_cdk_macros::query;
pub use sns_rewards_api_canister::get_active_payment_rounds::Response as GetActivePaymentRoundResponse;

// no real use for this, mainly for testing. Remove later
#[query(hidden = true)]
fn get_active_payment_rounds() -> GetActivePaymentRoundResponse {
    read_state(|state| {
        state
            .data
            .payment_processor
            .get_active_rounds(NeuronFlow::Regular)
    })
}
