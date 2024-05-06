use candid::Principal;
use icrc_ledger_types::icrc1::account::Account;
use types::CanisterId;

pub const E8S_PER_OGY: u64 = 100_000_000;
pub const E8S_FEE_OGY: u64 = 200_000;

pub const SNS_ROOT_CANISTER_ID: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 2, 0, 0, 124, 1, 1]
);
pub const SNS_GOVERNANCE_CANISTER_ID: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 2, 0, 0, 125, 1, 1]
);
pub const SNS_GOVERNANCE_CANISTER_ID_STAGING: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 1, 224, 14, 183, 1, 1]
);
pub const SNS_LEDGER_CANISTER_ID: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 2, 0, 0, 126, 1, 1]
);
pub const SNS_LEDGER_INDEX_CANISTER_ID: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 2, 0, 0, 128, 1, 1]
);
pub const SNS_REWARDS_CANISTER_ID: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 1, 80, 17, 105, 1, 1]
);
pub const NNS_GOVERNANCE_CANISTER_ID: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 0, 0, 0, 1, 1, 1]
);
pub const ICP_LEDGER_CANISTER_ID: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 0, 0, 0, 2, 1, 1]
);
pub const CYCLES_MINTING_CANISTER_ID: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 0, 0, 0, 4, 1, 1]
);
pub const ICP_LEDGER_CANISTER_ID_STAGING: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 1, 112, 26, 234, 1, 1]
);
pub const OGY_LEDGER_CANISTER_ID_STAGING: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 1, 80, 17, 179, 1, 1]
);
pub const OGY_LEDGER_CANISTER_ID: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 1, 32, 0, 185, 1, 1]
);
pub const OGY_LEGACY_LEDGER_CANISTER_ID: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 1, 32, 0, 185, 1, 1]
);
pub const SNS_LEDGER_CANISTER_ID_STAGING: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 1, 224, 14, 185, 1, 1]
);
pub const SUPER_STATS_CANISTER_ID: CanisterId = Principal::from_slice(
    &[0, 0, 0, 0, 1, 224, 56, 250, 1, 1]
);

// TODO: Fill this with principals of Foundation
pub const TEAM_PRINCIPALS: [Account; 3] = [
    // fv4gl-4digp-v54d7-yclkh-mokfc-3ugji-uim47-pb357-6cjtl-bz5sf-gqe
    Account {
        owner: Principal::from_slice(
            &[
                104, 51, 235, 222, 15, 248, 18, 212, 118, 57, 69, 22, 232, 100, 162, 136, 103, 62,
                240, 239, 191, 240, 147, 53, 135, 61, 145, 77, 2,
            ]
        ),
        subaccount: None,
    },
    // 3432o-lw3ke-mhdyc-yejn7-uh2f4-jhxji-qyovs-47lfe-kd7eh-aenvp-uqe
    Account {
        owner: Principal::from_slice(
            &[
                219, 81, 24, 113, 224, 88, 34, 91, 250, 31, 69, 226, 79, 116, 162, 24, 117, 101,
                207, 172, 164, 80, 254, 67, 128, 141, 171, 233, 2,
            ]
        ),
        subaccount: None,
    },
    // SNS Rewards Canister
    // 2f5ll-gqaaa-aaaak-qcfuq-cai
    Account {
        owner: SNS_REWARDS_CANISTER_ID,
        subaccount: Some([
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0,
        ]),
    },
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sns_governance_canister_id() {
        assert_eq!(
            SNS_GOVERNANCE_CANISTER_ID,
            Principal::from_text("tr3th-kiaaa-aaaaq-aab6q-cai").unwrap()
        )
    }

    #[test]
    fn team_principal() {
        assert_eq!(
            OGY_LEGACY_LEDGER_CANISTER_ID,
            Principal::from_text("3xwpq-ziaaa-aaaah-qcn4a-cai").unwrap()
        )
    }
}
