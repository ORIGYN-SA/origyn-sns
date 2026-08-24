use crate::guards::caller_is_governance_principal;
use bity_ic_canister_tracing_macros::trace;
use ic_cdk_macros::{query, update};
use types::TokenSymbol;

#[query(guard = "caller_is_governance_principal", hidden = true)]
#[trace]
pub async fn update_token_fee_validate(token: TokenSymbol) -> Result<String, String> {
    Ok(format!("Query and update fee dynamically for {:?}", token))
}

#[update(guard = "caller_is_governance_principal")]
#[trace]
pub async fn update_token_fee(token: TokenSymbol) -> Result<u64, String> {
    let is_test_mode = crate::state::read_state(|s| s.env.is_test_mode());
    let ledger_id = token.ledger_id(is_test_mode);

    types::update_token_fee(ledger_id).await
}
