use candid::Principal;
use types::CanisterId;

pub const E8S_PER_OGY: u64 = 100_000_000;
pub const E8S_FEE_OGY: u64 = 200_000;

// staging constants
pub const OGY_LEDGER_CANISTER_ID_STAGING: CanisterId =
    Principal::from_slice(&[0, 0, 0, 0, 1, 32, 0, 185, 1, 1]);
pub const OGY_LEGACY_LEDGER_CANISTER_ID_STAGING: CanisterId =
    Principal::from_slice(&[0, 0, 0, 0, 1, 80, 17, 179, 1, 1]);

// production constants
pub const OGY_LEDGER_CANISTER_ID: CanisterId =
    Principal::from_slice(&[0, 0, 0, 0, 1, 32, 0, 185, 1, 1]);
pub const OGY_LEGACY_LEDGER_CANISTER_ID: CanisterId =
    Principal::from_slice(&[0, 0, 0, 0, 1, 32, 0, 185, 1, 1]);
pub const OGY_LEGACY_MINTING_CANISTER_ID: CanisterId =
    Principal::from_slice(&[0, 0, 0, 0, 1, 32, 0, 220, 1, 1]);
pub const OGY_LEGACY_MINTING_CANISTER_ACCOUNT_ID: &str =
    "0dbad1cec635d530ac6b1eaa3fc5390e1aa4e4c87a80f114e9da168c76841009";
pub const SNS_GOVERNANCE_CANISTER_ID: CanisterId =
    Principal::from_slice(&[0, 0, 0, 0, 2, 0, 0, 125, 1, 1]);

#[cfg(test)]
mod tests {
    use ic_ledger_types::{AccountIdentifier, DEFAULT_SUBACCOUNT};

    use super::*;

    #[test]
    fn ogy_ledger_canister_id_dev() {
        assert_eq!(
            OGY_LEDGER_CANISTER_ID_STAGING,
            Principal::from_text("jwcfb-hyaaa-aaaaj-aac4q-cai").unwrap()
        )
    }
    #[test]
    fn ogy_ledger_canister_id() {
        assert_eq!(
            OGY_LEDGER_CANISTER_ID,
            Principal::from_text("jwcfb-hyaaa-aaaaj-aac4q-cai").unwrap()
        )
    }

    #[test]
    fn ogy_legacy_ledger_canister_id() {
        assert_eq!(
            OGY_LEGACY_LEDGER_CANISTER_ID,
            Principal::from_text("jwcfb-hyaaa-aaaaj-aac4q-cai").unwrap()
        )
    }

    #[test]
    fn ogy_legacy_minting_canister_id() {
        assert_eq!(
            OGY_LEGACY_MINTING_CANISTER_ID,
            Principal::from_text("aomfs-vaaaa-aaaaj-aadoa-cai").unwrap()
        )
    }

    #[test]
    fn ogy_legacy_minting_canister_account_id() {
        assert_eq!(
            OGY_LEGACY_MINTING_CANISTER_ACCOUNT_ID,
            AccountIdentifier::new(
                &Principal::from_text("aomfs-vaaaa-aaaaj-aadoa-cai").unwrap(),
                &DEFAULT_SUBACCOUNT
            )
            .to_string()
        )
    }

    #[test]
    fn sns_governance_canister_id() {
        assert_eq!(
            SNS_GOVERNANCE_CANISTER_ID,
            Principal::from_text("tr3th-kiaaa-aaaaq-aab6q-cai").unwrap()
        )
    }
}
