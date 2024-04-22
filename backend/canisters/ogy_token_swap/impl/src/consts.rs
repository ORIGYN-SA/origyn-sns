use candid::Principal;
use ic_ledger_types::Tokens;
use types::CanisterId;
use utils::consts::E8S_PER_OGY;

pub const OGY_MIN_SWAP_AMOUNT: Tokens = Tokens::from_e8s(1 * E8S_PER_OGY);

pub const OGY_LEGACY_MINTING_CANISTER_ID: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 1, 32, 0, 220, 1, 1]
);
pub const OGY_LEGACY_MINTING_CANISTER_ACCOUNT_ID: &str =
    "0dbad1cec635d530ac6b1eaa3fc5390e1aa4e4c87a80f114e9da168c76841009";

pub const ORIGYN_ADMIN_PRINCIPAL: Principal = Principal::from_slice(
    &[
        168, 73, 98, 65, 114, 3, 53, 151, 50, 4, 243, 242, 129, 191, 146, 202, 175, 111, 174, 7,
        139, 59, 74, 84, 101, 90, 253, 254, 2,
    ]
);

#[cfg(test)]
mod tests {
    use ic_ledger_types::{ AccountIdentifier, DEFAULT_SUBACCOUNT };

    use super::*;

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
            ).to_string()
        )
    }

    #[test]
    fn origyn_admin_principal() {
        assert_eq!(
            ORIGYN_ADMIN_PRINCIPAL,
            Principal::from_text(
                "f32hc-unijf-rec4q-dgwlt-ebht6-ka37e-wkv5x-24b4l-hnffi-zk27x-7ae"
            ).unwrap()
        )
    }
}
