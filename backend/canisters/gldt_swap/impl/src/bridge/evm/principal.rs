//! ICP accounts in the `BurnedToIcp` event.
//!
//! The principal is a `bytes32`: byte 0 is its length (1 to 29), then the principal bytes,
//! then zeros. This is the encoding DFINITY's ckETH helper contract uses, and exactly what the
//! contract's `IcpPrincipal.isValid` accepts. The subaccount is 32 bytes; all zero means the
//! default account.

use candid::Principal;
use icrc_ledger_types::icrc1::account::Account;

/// The longest principal, in bytes.
const MAX_PRINCIPAL_LEN: usize = 29;

/// The ICP account of a burn. Rejects what the contract rejects; never panics.
pub fn decode_icp_account(principal: [u8; 32], subaccount: [u8; 32]) -> Result<Account, String> {
    let len = principal[0] as usize;
    if len == 0 || len > MAX_PRINCIPAL_LEN {
        return Err(format!("ICP principal length {len} is not 1 to 29"));
    }
    if principal[1 + len..].iter().any(|b| *b != 0) {
        return Err(format!(
            "ICP principal has nonzero bytes after its {len} bytes"
        ));
    }
    let owner = Principal::try_from_slice(&principal[1..=len])
        .map_err(|e| format!("bad ICP principal: {e}"))?;
    let subaccount = if subaccount == [0u8; 32] {
        None
    } else {
        Some(subaccount)
    };
    Ok(Account { owner, subaccount })
}

/// The `bytes32` a frontend passes to `burnToIcp` for `p`. The empty principal (the
/// management canister) encodes to length 0, which the contract rejects.
pub fn encode_icp_principal(p: &Principal) -> [u8; 32] {
    // a Principal holds at most 29 bytes
    let bytes = p.as_slice();
    let mut out = [0u8; 32];
    out[0] = bytes.len() as u8;
    out[1..=bytes.len()].copy_from_slice(bytes);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn principals() -> Vec<Principal> {
        vec![
            // 1 byte
            Principal::anonymous(),
            // a canister id, 10 bytes
            Principal::from_text("6f6ua-hqaaa-aaaar-qairq-cai").unwrap(),
            // the longest principal, 29 bytes
            Principal::from_slice(&[0xab; 29]),
        ]
    }

    #[test]
    fn principal_roundtrip_and_zero_subaccount_is_none() {
        let subaccount = [7u8; 32];
        for p in principals() {
            let len = p.as_slice().len();
            let word = encode_icp_principal(&p);
            assert_eq!(word[0] as usize, len);
            assert_eq!(&word[1..=len], p.as_slice());
            assert!(word[1 + len..].iter().all(|b| *b == 0));

            assert_eq!(
                decode_icp_account(word, [0; 32]).unwrap(),
                Account {
                    owner: p,
                    subaccount: None
                }
            );
            assert_eq!(
                decode_icp_account(word, subaccount).unwrap(),
                Account {
                    owner: p,
                    subaccount: Some(subaccount)
                }
            );
        }

        // one nonzero byte anywhere makes it a real subaccount
        let mut last = [0u8; 32];
        last[31] = 1;
        let anonymous = encode_icp_principal(&Principal::anonymous());
        assert_eq!(
            decode_icp_account(anonymous, last).unwrap().subaccount,
            Some(last)
        );

        // the anonymous principal 2vxsx-fae is the single byte 0x04
        assert_eq!(
            alloy_primitives::hex::encode(anonymous),
            format!("0104{}", "00".repeat(30))
        );
    }

    #[test]
    fn principal_rejects_len_0_len_30_and_trailing_bytes() {
        // length 0, alone and with bytes after it
        assert!(decode_icp_account([0; 32], [0; 32]).is_err());
        let mut word = [0u8; 32];
        word[1] = 4;
        assert!(decode_icp_account(word, [0; 32]).is_err());
        // the empty principal (the management canister) encodes to length 0, which nobody accepts
        let empty = encode_icp_principal(&Principal::management_canister());
        assert_eq!(empty, [0u8; 32]);
        assert!(decode_icp_account(empty, [0; 32]).is_err());

        // lengths past 29
        for len in [30u8, 31, 32, 255] {
            let mut word = [0u8; 32];
            word[0] = len;
            word[1..=30].fill(1);
            assert!(decode_icp_account(word, [0; 32]).is_err(), "len {len}");
        }

        // a nonzero byte right after the principal, and in the last byte
        let canister = Principal::from_text("6f6ua-hqaaa-aaaar-qairq-cai").unwrap();
        let mut word = encode_icp_principal(&canister);
        word[11] = 1;
        assert!(decode_icp_account(word, [0; 32]).is_err());
        let mut word = encode_icp_principal(&Principal::anonymous());
        word[31] = 0x80;
        assert!(decode_icp_account(word, [0; 32]).is_err());

        // 29 bytes fill the word up to byte 29; bytes 30 and 31 must stay zero
        let mut word = encode_icp_principal(&Principal::from_slice(&[0xab; 29]));
        assert!(decode_icp_account(word, [0; 32]).is_ok());
        word[30] = 1;
        assert!(decode_icp_account(word, [0; 32]).is_err());
    }
}
