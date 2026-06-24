use crate::state::read_state;
use candid::Principal;

pub fn caller_is_governance_principal() -> Result<(), String> {
    if read_state(|state| state.is_caller_governance_principal()) {
        Ok(())
    } else {
        Err("Caller is not a governance principal".to_string())
    }
}

pub fn reject_anonymous_caller() -> Result<(), String> {
    if ic_cdk::api::msg_caller() == Principal::anonymous() {
        return Err("You may not use an anonymous principal".to_string());
    }
    Ok(())
}
