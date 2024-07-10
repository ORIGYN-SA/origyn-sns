use candid::Principal;
use sns_governance_canister::types::ProposalData;
use std::str::FromStr;
use icrc_ledger_types::icrc1::account::Account;

pub fn string_to_account(input: String) -> Result<Account, String> {
    if let Some(index) = input.find('.') {
        let (principal_str, subaccount_str) = input.split_at(index);
        let subaccount_str: String = subaccount_str.chars().skip(1).collect();
        match Principal::from_str(principal_str) {
            Ok(valid_principal) => {
                match hex::decode(subaccount_str) {
                    Ok(decoded_subaccount) => {
                        if decoded_subaccount.len() == 32 {
                            let mut subaccount_array = [0u8; 32];
                            subaccount_array.copy_from_slice(&decoded_subaccount);

                            let principal_with_subaccount = Account {
                                owner: valid_principal,
                                subaccount: Some(subaccount_array),
                            };
                            Ok(principal_with_subaccount)
                        } else {
                            Err(
                                "split_into_principal_and_account -> subaccount length check, expected 32 bytes".to_string()
                            )
                        }
                    }
                    Err(err) => {
                        let err_message = format!(
                            "split_into_principal_and_account -> hex::decode(subaccount_value){err:?}"
                        );
                        Err(err_message)
                    }
                }
            }
            Err(err) => Err(err.to_string()),
        }
    } else {
        match Principal::from_str(input.as_str()) {
            Ok(valid_principal) => {
                Ok(Account {
                    owner: valid_principal,
                    subaccount: None,
                })
            }
            Err(err) => Err(err.to_string()),
        }
    }
}

pub fn is_proposal_closed(proposal: &ProposalData) -> bool {
    proposal.decided_timestamp_seconds > 0
}
