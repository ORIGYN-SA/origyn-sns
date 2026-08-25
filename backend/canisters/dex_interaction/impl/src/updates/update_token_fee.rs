use crate::guards::caller_is_governance_principal;
use bity_ic_canister_tracing_macros::trace;
use ic_cdk_macros::{query, update};
use types::TokenSymbol;
use candid::Principal;

#[query(guard = "caller_is_governance_principal", hidden = true)]
#[trace]
pub async fn update_token_fee_validate(
    token: TokenSymbol,
    custom_ledger_id: Option<Principal>,
) -> Result<String, String> {
    Ok(format!(
        "Query and update fee dynamically for {:?} with custom ledger {:?}",
        token, custom_ledger_id
    ))
}

#[update(guard = "caller_is_governance_principal")]
#[trace]
pub async fn update_token_fee(
    token: TokenSymbol,
    custom_ledger_id: Option<Principal>,
) -> Result<u64, String> {
    let ledger_id = match custom_ledger_id {
        Some(id) => id,
        None => {
            let is_test_mode = crate::state::read_state(|s| s.env.is_test_mode());
            token.get_token_info(is_test_mode).ledger_id
        }
    };

    let call_res = bity_ic_canister_client::make_c2c_call(
        ledger_id,
        "icrc1_fee",
        &(),
        candid::encode_one,
        |r| candid::decode_one::<candid::Nat>(r),
    )
    .await;

    match call_res {
        Ok(fee_nat) => {
            let fee_u64 = fee_nat.0.clone().try_into().unwrap_or(0);
            types::override_token_ledger(token, ledger_id, fee_u64);
            Ok(fee_u64)
        }
        Err(e) => Err(format!("Ledger call failed: {:?}", e)),
    }
}
