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
) -> Result<candid::Nat, String> {
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
            types::override_token_ledger(token, ledger_id, fee_nat.clone());
            Ok(fee_nat)
        }
        Err(e) => Err(format!("Ledger call failed: {:?}", e)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::{init_state, RuntimeState};
    use candid::Nat;

    fn init_runtime_state() {
        init_state(RuntimeState::default());
    }

    #[test]
    fn test_token_fee_overrides() {
        init_runtime_state();

        let is_test_mode = false;
        let token = TokenSymbol::ICP;

        // Clear the global cache to start with a cache miss
        // Note: the thread local cache is in types::token::__TOKENS
        // and we can clear it using override_token_ledger or test it directly.
        
        // 1. Initially it should return the default fee for ICP (10_000)
        let info = token.get_token_info(is_test_mode);
        assert_eq!(info.fee, Nat::from(10_000_u64));

        // 2. Override the ledger and fee for ICP
        let custom_fee = Nat::from(5_000_u64);
        let ledger_id = token.ledger_id(is_test_mode);
        types::override_token_ledger(token, ledger_id, custom_fee.clone());

        // 3. Verify it returns the overridden fee
        let info = token.get_token_info(is_test_mode);
        assert_eq!(info.fee, custom_fee);

        // 4. Update the fee cache using the update cache method (cache hit path)
        let updated_fee = Nat::from(20_000_u64);
        types::update_token_fee_cache(ledger_id, updated_fee.clone());

        // 5. Verify it returns the updated fee
        let info = token.get_token_info(is_test_mode);
        assert_eq!(info.fee, updated_fee);
    }
}

