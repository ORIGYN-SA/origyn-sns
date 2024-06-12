use candid::Nat;

pub fn validate_set_daily_burn_amount_payload(amount: &Nat) -> Result<(), String> {
    if amount == &Nat::from(0u64) {
        return Err(format!("ERROR : The amount for burning must be more than 0"));
    }

    Ok(())
}
