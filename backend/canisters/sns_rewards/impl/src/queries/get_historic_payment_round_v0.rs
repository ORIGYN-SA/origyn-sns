use ic_cdk_macros::query;
pub use sns_rewards_api_canister::get_historic_payment_round_v0::{
    Args as GetHistoricPaymentRoundsV0Args, Response as GetHistoricPaymentRoundsV0Response,
};

use crate::state::read_state;

#[query(hidden = true)]
fn get_historic_payment_round_v0(
    args: GetHistoricPaymentRoundsV0Args,
) -> GetHistoricPaymentRoundsV0Response {
    read_state(|state| {
        state
            .data
            .payment_processor
            .get_payment_round_history_v0(args.token, args.round_id)
    })
}
