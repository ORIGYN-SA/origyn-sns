use candid::Principal;
use ic_ledger_types::{AccountIdentifier, Subaccount, DEFAULT_SUBACCOUNT};
use icrc_ledger_types::icrc1::account::Account;

pub fn icrc_account_to_legacy_account_id(icrc_account: Account) -> AccountIdentifier {
    let subaccount: Subaccount = icrc_account
        .subaccount
        .map_or(DEFAULT_SUBACCOUNT, Subaccount);
    AccountIdentifier::new(&icrc_account.owner, &subaccount)
}

pub fn principal_to_legacy_account_id(
    principal: Principal,
    subaccount: Option<Subaccount>,
) -> AccountIdentifier {
    AccountIdentifier::new(&principal, &subaccount.unwrap_or(DEFAULT_SUBACCOUNT))
}

#[cfg(test)]
mod tests {
    use candid::Principal;
    use icrc_ledger_types::icrc1::account::Account;

    use crate::icrc_account_to_legacy_account_id;

    #[test]
    fn convert_icrc_account_to_legacy_account_id() {
        let icrc_account = Account {
            owner: Principal::from_text(
                "f32hc-unijf-rec4q-dgwlt-ebht6-ka37e-wkv5x-24b4l-hnffi-zk27x-7ae",
            )
            .unwrap(),
            subaccount: None,
        };
        let result = icrc_account_to_legacy_account_id(icrc_account);

        let expected_result =
            "aacba041bbce2b03c66307a68ca2d5a704a1f87397694a1292d89ce757136f11".to_string();

        assert_eq!(result.to_hex(), expected_result)
    }

    #[test]
    fn convert_icrc_account_to_legacy_account_id_with_subaccount() {
        let icrc_account = Account {
            owner: Principal::from_text(
                "f32hc-unijf-rec4q-dgwlt-ebht6-ka37e-wkv5x-24b4l-hnffi-zk27x-7ae",
            )
            .unwrap(),
            subaccount: Some([
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 1,
            ]),
        };
        let result = icrc_account_to_legacy_account_id(icrc_account);

        let expected_result =
            "2fab56f6af866bd4580c8bdf821849d470d5d0af6a671191c602e0c434b5e55c".to_string();

        assert_eq!(result.to_hex(), expected_result)
    }
}
