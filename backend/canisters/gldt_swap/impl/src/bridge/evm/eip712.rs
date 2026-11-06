//! The EIP-712 digests the canister signs (spec 6.4 and 6.6).
//!
//! Claims, admin actions and EIP-2612 permits share the token's domain
//! `("Gold Token", "1", chainId, token proxy)`: the name is the token's `name()`, set by
//! `__ERC20Permit_init(name)`. The type strings match `CLAIM_TYPEHASH`, `CALL_TYPEHASH` and
//! `EXECUTE_TYPEHASH` in `GLDT.sol`; `evm/gldt-bridge/test/Vectors.t.sol` proves the digests
//! equal the contract's.

use alloy_primitives::{Address, U256};
use alloy_sol_types::{sol, Eip712Domain, SolStruct};
use std::borrow::Cow;

pub const DOMAIN_NAME: &str = "Gold Token";
pub const DOMAIN_VERSION: &str = "1";

sol! {
    /// `Claim(uint64 icpBurnIndex,address recipient,uint256 amount)`
    struct Claim {
        uint64 icpBurnIndex;
        address recipient;
        uint256 amount;
    }

    /// `Call(address target,bytes data)`
    struct Call {
        address target;
        bytes data;
    }

    /// `Execute(Call[] calls,uint256 nonce,uint256 deadline)Call(address target,bytes data)`
    struct Execute {
        Call[] calls;
        uint256 nonce;
        uint256 deadline;
    }
}

/// The token's EIP-712 domain on one chain.
pub fn domain(chain_id: u64, token: [u8; 20]) -> Eip712Domain {
    Eip712Domain::new(
        Some(Cow::Borrowed(DOMAIN_NAME)),
        Some(Cow::Borrowed(DOMAIN_VERSION)),
        Some(U256::from(chain_id)),
        Some(Address::from(token)),
        None,
    )
}

/// The digest the claims key signs for `claimFromIcp`.
pub fn claim_digest(
    chain_id: u64,
    token: [u8; 20],
    icp_burn_index: u64,
    recipient: [u8; 20],
    amount: U256,
) -> [u8; 32] {
    Claim {
        icpBurnIndex: icp_burn_index,
        recipient: Address::from(recipient),
        amount,
    }
    .eip712_signing_hash(&domain(chain_id, token))
    .0
}

/// The digest the admin key signs for `execute`; the token's `hashExecute` gives the same.
pub fn execute_digest(
    chain_id: u64,
    token: [u8; 20],
    calls: &[([u8; 20], Vec<u8>)],
    nonce: u64,
    deadline: u64,
) -> [u8; 32] {
    Execute {
        calls: calls
            .iter()
            .map(|(target, data)| Call {
                target: Address::from(*target),
                data: data.clone().into(),
            })
            .collect(),
        nonce: U256::from(nonce),
        deadline: U256::from(deadline),
    }
    .eip712_signing_hash(&domain(chain_id, token))
    .0
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::evm::vectors;
    use alloy_primitives::{hex, keccak256, U256};

    const CHAIN_ID: u64 = 31337;
    const TOKEN: [u8; 20] = hex!("00000000000000000000000000000000000b1d6e");
    const RECIPIENT: [u8; 20] = hex!("70997970c51812dc3a010c7d01b50e0d17dc79c8");

    fn uint(v: u128) -> [u8; 32] {
        U256::from(v).to_be_bytes()
    }

    fn word(a: [u8; 20]) -> [u8; 32] {
        let mut w = [0u8; 32];
        w[12..].copy_from_slice(&a);
        w
    }

    /// The domain separator built from the literal EIP-712 strings.
    fn domain_separator(chain_id: u64, token: [u8; 20]) -> [u8; 32] {
        keccak256(
            [
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
                )
                .0,
                keccak256("Gold Token").0,
                keccak256("1").0,
                uint(chain_id as u128),
                word(token),
            ]
            .concat(),
        )
        .0
    }

    fn typed_digest(chain_id: u64, token: [u8; 20], struct_hash: [u8; 32]) -> [u8; 32] {
        keccak256(
            [
                &[0x19u8, 0x01][..],
                &domain_separator(chain_id, token),
                &struct_hash,
            ]
            .concat(),
        )
        .0
    }

    #[test]
    fn type_strings_match_the_contract() {
        assert_eq!(DOMAIN_NAME, "Gold Token");
        assert_eq!(DOMAIN_VERSION, "1");
        assert_eq!(
            Claim::eip712_encode_type(),
            "Claim(uint64 icpBurnIndex,address recipient,uint256 amount)"
        );
        assert_eq!(
            Call::eip712_encode_type(),
            "Call(address target,bytes data)"
        );
        assert_eq!(
            Execute::eip712_encode_type(),
            "Execute(Call[] calls,uint256 nonce,uint256 deadline)Call(address target,bytes data)"
        );
        assert_eq!(
            domain(CHAIN_ID, TOKEN).separator().0,
            domain_separator(CHAIN_ID, TOKEN)
        );
    }

    #[test]
    fn claim_digest_matches_hand_built_eip712() {
        for (index, amount) in [
            (0u64, U256::from(1u8)),
            (u64::MAX, U256::from(1u8) << 128),
            (5, U256::MAX),
        ] {
            let struct_hash = keccak256(
                [
                    keccak256("Claim(uint64 icpBurnIndex,address recipient,uint256 amount)").0,
                    uint(index as u128),
                    word(RECIPIENT),
                    amount.to_be_bytes(),
                ]
                .concat(),
            )
            .0;
            assert_eq!(
                claim_digest(CHAIN_ID, TOKEN, index, RECIPIENT, amount),
                typed_digest(CHAIN_ID, TOKEN, struct_hash)
            );
        }
    }

    #[test]
    fn execute_digest_matches_hand_built_eip712() {
        let call_typehash = keccak256("Call(address target,bytes data)").0;
        let execute_typehash = keccak256(
            "Execute(Call[] calls,uint256 nonce,uint256 deadline)Call(address target,bytes data)",
        )
        .0;
        let calls = [
            (
                TOKEN,
                hex!("05a21cda0000000000000000000000000000000000000000000000000000000005f5e100")
                    .to_vec(),
            ),
            (RECIPIENT, vec![]),
            (TOKEN, vec![0xab; 100]),
        ];
        for n in [0usize, 1, 3] {
            let calls = &calls[..n];
            let call_hashes: Vec<u8> = calls
                .iter()
                .flat_map(|(target, data)| {
                    keccak256([call_typehash, word(*target), keccak256(data).0].concat()).0
                })
                .collect();
            let struct_hash = keccak256(
                [
                    execute_typehash,
                    keccak256(&call_hashes).0,
                    uint(u64::MAX as u128),
                    uint(1_900_000_000),
                ]
                .concat(),
            )
            .0;
            assert_eq!(
                execute_digest(CHAIN_ID, TOKEN, calls, u64::MAX, 1_900_000_000),
                typed_digest(CHAIN_ID, TOKEN, struct_hash),
                "{n} calls"
            );
        }
    }

    #[test]
    fn digests_depend_on_chain_and_token() {
        let amount = U256::from(100_000_000u64);
        let base = claim_digest(1, TOKEN, 1, RECIPIENT, amount);
        assert_ne!(base, claim_digest(8453, TOKEN, 1, RECIPIENT, amount));
        assert_ne!(base, claim_digest(1, RECIPIENT, 1, RECIPIENT, amount));
        let calls = [(TOKEN, vec![1u8])];
        let base = execute_digest(1, TOKEN, &calls, 1, 2);
        assert_ne!(base, execute_digest(8453, TOKEN, &calls, 1, 2));
        assert_ne!(base, execute_digest(1, RECIPIENT, &calls, 1, 2));
    }

    #[test]
    fn claim_digest_matches_vector_file() {
        let file = vectors::load();
        assert_eq!(file.chain_id, vectors::CHAIN_ID);
        assert_eq!(vectors::address(&file.token), vectors::TOKEN);
        assert_eq!(file.claims.len(), 3);
        assert!(file
            .claims
            .iter()
            .any(|c| vectors::amount(&c.amount) == U256::from(1u8) << 128));
        for claim in &file.claims {
            let digest = claim_digest(
                file.chain_id,
                vectors::address(&file.token),
                claim.icp_burn_index,
                vectors::address(&claim.recipient),
                vectors::amount(&claim.amount),
            );
            assert_eq!(digest, vectors::bytes32(&claim.digest), "{claim:?}");
            assert_eq!(
                vectors::recover(digest, &claim.signature),
                vectors::address(&file.signer)
            );
        }
    }

    #[test]
    fn execute_digest_matches_vector_file() {
        let file = vectors::load();
        assert_eq!(file.executes.len(), 2);
        assert_eq!(
            file.executes
                .iter()
                .map(|e| e.calls.len())
                .collect::<Vec<_>>(),
            vec![1, 3]
        );
        // the three-call batch includes an endpoint setConfig
        assert!(file.executes[1]
            .calls
            .iter()
            .any(|c| vectors::address(&c.target) == vectors::address(&file.endpoint)));
        for execute in &file.executes {
            let calls: Vec<([u8; 20], Vec<u8>)> = execute
                .calls
                .iter()
                .map(|c| (vectors::address(&c.target), vectors::bytes(&c.data)))
                .collect();
            let digest = execute_digest(
                file.chain_id,
                vectors::address(&file.token),
                &calls,
                execute.nonce,
                execute.deadline,
            );
            assert_eq!(digest, vectors::bytes32(&execute.digest), "{execute:?}");
            assert_eq!(
                vectors::recover(digest, &execute.signature),
                vectors::address(&file.signer)
            );
        }
    }
}
