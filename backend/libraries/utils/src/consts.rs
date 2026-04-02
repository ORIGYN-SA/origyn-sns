use candid::Principal;
use types::CanisterId;

pub const E8S_PER_OGY: u64 = 100_000_000;
pub const E8S_FEE_OGY: u64 = 200_000;

pub const SNS_GOVERNANCE_CANISTER_ID: CanisterId =
    Principal::from_slice(&[0, 0, 0, 0, 2, 0, 0, 206, 1, 1]);

pub const NNS_GOVERNANCE_CANISTER_ID: CanisterId =
    Principal::from_slice(&[0, 0, 0, 0, 0, 0, 0, 1, 1, 1]);

pub const SNS_GOVERNANCE_CANISTER_ID_STAGING: CanisterId =
    Principal::from_slice(&[0, 0, 0, 0, 1, 96, 72, 189, 1, 1]);

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_nns_governance_id() {
        let expected = Principal::from_str("rrkah-fqaaa-aaaaa-aaaaq-cai").unwrap();
        println!("expected: {:?}", expected.as_slice());
        assert_eq!(NNS_GOVERNANCE_CANISTER_ID, expected);
    }

    #[test]
    fn test_sns_governance_id() {
        let expected = Principal::from_str("lnxxh-yaaaa-aaaaq-aadha-cai").unwrap();
        println!("expected: {:?}", expected.as_slice());
        assert_eq!(SNS_GOVERNANCE_CANISTER_ID, expected);
    }

    #[test]
    fn test_sns_governance_id_staging() {
        let expected = Principal::from_str("jtpnb-waaaa-aaaal-ajc6q-cai").unwrap();
        println!("expected: {:?}", expected.as_slice());
        assert_eq!(SNS_GOVERNANCE_CANISTER_ID_STAGING, expected);
    }
}
