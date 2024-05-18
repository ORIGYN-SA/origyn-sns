use candid::Principal;
use ic_ledger_types::Tokens;
use icrc_ledger_types::icrc1::account::Account;

pub const E8S_PER_OGY: u64 = 100_000_000;
pub const E8S_FEE_OGY: u64 = 200_000;

pub const OGY_MIN_SWAP_AMOUNT: Tokens = Tokens::from_e8s(1 * E8S_PER_OGY);

pub const ORIGYN_ADMIN_PRINCIPAL: Principal = Principal::from_slice(
    &[
        168, 73, 98, 65, 114, 3, 53, 151, 50, 4, 243, 242, 129, 191, 146, 202, 175, 111, 174, 7,
        139, 59, 74, 84, 101, 90, 253, 254, 2,
    ]
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
        owner: Principal::from_slice(&[0, 0, 0, 0, 1, 80, 17, 105, 1, 1]),
        subaccount: Some([
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0,
        ]),
    },
];

pub const GOLD_TREASURY_SUBACCOUNT_STR: String = "tr3th-kiaaa-aaaaq-aab6q-cai.7776d299b4a804a14862b02bff7b74d1b956e431f5f832525d966d67ff3d7ce8".to_string();

#[cfg(test)]
mod tests {
    use super::*;

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
