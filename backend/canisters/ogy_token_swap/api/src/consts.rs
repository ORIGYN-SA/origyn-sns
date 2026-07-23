use candid::Principal;
use utils::consts::E8S_FEE_OGY;

// The deposited block amount must be at least OGY_MIN_SWAP_AMOUNT - E8S_FEE_OGY,
// and the legacy ledger rejects burns below the transfer fee, so this is the
// lowest threshold at which the burn step can still succeed.
pub const OGY_MIN_SWAP_AMOUNT: u64 = 2 * E8S_FEE_OGY;

pub const ORIGYN_ADMIN_PRINCIPAL: Principal = Principal::from_slice(&[
    168, 73, 98, 65, 114, 3, 53, 151, 50, 4, 243, 242, 129, 191, 146, 202, 175, 111, 174, 7, 139,
    59, 74, 84, 101, 90, 253, 254, 2,
]);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn origyn_admin_principal() {
        assert_eq!(
            ORIGYN_ADMIN_PRINCIPAL,
            Principal::from_text("f32hc-unijf-rec4q-dgwlt-ebht6-ka37e-wkv5x-24b4l-hnffi-zk27x-7ae")
                .unwrap()
        )
    }
}
