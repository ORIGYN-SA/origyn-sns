//! EIP-712 vectors shared with the contract: `evm/gldt-bridge/test/vectors/eip712.json`.
//!
//! Rust writes the file (`cargo test -p gldt_swap write_vectors -- --ignored`) and
//! `evm/gldt-bridge/test/Vectors.t.sol` checks every digest and signature against the real
//! contract. The unit tests here fail when the file no longer matches what this code builds.
//!
//! The key is anvil's public account 0 key. The token sits at a fixed address on Foundry's
//! default chain 31337. The endpoint and receive library are the addresses the contract
//! fixture deploys them at; `Vectors.t.sol` checks that they still are.

use crate::bridge::evm::abi::encode_call;
use crate::bridge::evm::address::{evm_address, format_address, parse_address};
use crate::bridge::evm::eip712::{claim_digest, execute_digest};
use crate::bridge::signer::normalize_signature;
use alloy_primitives::{hex, U256};
use candid::Nat;
use gldt_swap_common::bridge::EvmAdminAction;
use k256::ecdsa::{RecoveryId, Signature, SigningKey, VerifyingKey};
use k256::elliptic_curve::scalar::IsHigh;
use serde::{Deserialize, Serialize};

pub const PATH: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../../evm/gldt-bridge/test/vectors/eip712.json"
);

const NOTE: &str = "Written by `cargo test -p gldt_swap write_vectors -- --ignored` \
(backend/canisters/gldt_swap/impl/src/bridge/evm/vectors.rs). Checked by the gldt_swap unit \
tests and by test/Vectors.t.sol. Do not edit by hand.";

/// Anvil account 0, a public test key.
pub const KEY: &str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
/// Foundry's default chain id.
pub const CHAIN_ID: u64 = 31337;
pub const TOKEN: [u8; 20] = hex!("00000000000000000000000000000000000b1d6e");
/// The fixture's first LayerZero endpoint (EID 1) and its receive library.
pub const ENDPOINT: [u8; 20] = hex!("f62849f9a0b5bf2913b396098f7c7019b51a820a");
pub const RECEIVE_LIB: [u8; 20] = hex!("1d1499e622d69689cdf9004d05ec547d650ff211");
/// The fixture's second endpoint, the peer chain of the vector token.
const PEER_EID: u32 = 2;
/// Two made up DVNs, sorted ascending. The ULN only checks the list, not the contracts.
const DVN_1: [u8; 20] = hex!("000000000000000000000000000000000000d001");
const DVN_2: [u8; 20] = hex!("000000000000000000000000000000000000d002");
/// Anvil accounts 1 and 2.
const RECIPIENT_1: [u8; 20] = hex!("70997970c51812dc3a010c7d01b50e0d17dc79c8");
const RECIPIENT_2: [u8; 20] = hex!("3c44cdddb6a900fa2b585dd299e03d12fa4293bc");

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct VectorFile {
    pub note: String,
    pub key: String,
    pub signer: String,
    pub chain_id: u64,
    pub token: String,
    pub endpoint: String,
    pub receive_lib: String,
    pub claims: Vec<ClaimVector>,
    pub executes: Vec<ExecuteVector>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ClaimVector {
    pub icp_burn_index: u64,
    pub recipient: String,
    /// Decimal, since a `uint256` does not fit a JSON number.
    pub amount: String,
    pub digest: String,
    pub signature: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ExecuteVector {
    pub description: String,
    pub nonce: u64,
    pub deadline: u64,
    pub calls: Vec<CallVector>,
    pub digest: String,
    pub signature: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CallVector {
    pub target: String,
    pub data: String,
}

pub fn signing_key() -> SigningKey {
    SigningKey::from_slice(&hex::decode(KEY).unwrap()).unwrap()
}

/// SEC1 compressed, as `ecdsa_public_key` returns it.
pub fn public_key(key: &SigningKey) -> Vec<u8> {
    key.verifying_key()
        .to_encoded_point(true)
        .as_bytes()
        .to_vec()
}

pub fn address(text: &str) -> [u8; 20] {
    parse_address(text).unwrap()
}

pub fn amount(text: &str) -> U256 {
    text.parse().unwrap()
}

pub fn bytes(text: &str) -> Vec<u8> {
    hex::decode(text).unwrap()
}

pub fn bytes32(text: &str) -> [u8; 32] {
    bytes(text).try_into().unwrap()
}

fn hex0x(bytes: &[u8]) -> String {
    format!("0x{}", hex::encode(bytes))
}

pub fn to_bytes64(sig: &Signature) -> [u8; 64] {
    let mut out = [0u8; 64];
    out.copy_from_slice(&sig.to_bytes());
    out
}

/// The address an `r || s || v` signature recovers to, the way `ecrecover` reads it:
/// `v` is 27 or 28 and `s` must be low (k256 rejects high-s, like OpenZeppelin).
pub fn recover(digest: [u8; 32], signature: &str) -> [u8; 20] {
    let sig = bytes(signature);
    assert_eq!(sig.len(), 65);
    assert!(sig[64] == 27 || sig[64] == 28, "v is {}", sig[64]);
    let recovery_id = RecoveryId::new(sig[64] == 28, false);
    let key = VerifyingKey::recover_from_prehash(
        &digest,
        &Signature::from_slice(&sig[..64]).unwrap(),
        recovery_id,
    )
    .unwrap();
    evm_address(key.to_encoded_point(false).as_bytes())
}

/// Signs like the canister: k256 gives a low-s signature, which is turned high-s here
/// (tECDSA returns high-s about half the time), then `normalize_signature` brings it back.
fn sign(digest: [u8; 32]) -> String {
    let key = signing_key();
    let (low, _) = key.sign_prehash_recoverable(&digest).unwrap();
    let (r, s) = low.split_scalars();
    let high = Signature::from_scalars(r.to_bytes(), (-*s).to_bytes()).unwrap();
    assert!(bool::from(high.s().is_high()));
    let sig = normalize_signature(to_bytes64(&high), digest, &public_key(&key)).unwrap();
    hex0x(&sig)
}

fn claim(icp_burn_index: u64, recipient: [u8; 20], amount: U256) -> ClaimVector {
    let digest = claim_digest(CHAIN_ID, TOKEN, icp_burn_index, recipient, amount);
    ClaimVector {
        icp_burn_index,
        recipient: format_address(&recipient),
        amount: amount.to_string(),
        digest: hex0x(&digest),
        signature: sign(digest),
    }
}

fn execute(
    description: &str,
    nonce: u64,
    deadline: u64,
    actions: &[EvmAdminAction],
) -> ExecuteVector {
    let calls: Vec<([u8; 20], Vec<u8>)> = actions
        .iter()
        .flat_map(|action| encode_call(action, TOKEN, ENDPOINT).unwrap())
        .collect();
    let digest = execute_digest(CHAIN_ID, TOKEN, &calls, nonce, deadline);
    ExecuteVector {
        description: description.to_string(),
        nonce,
        deadline,
        calls: calls
            .iter()
            .map(|(target, data)| CallVector {
                target: format_address(target),
                data: hex0x(data),
            })
            .collect(),
        digest: hex0x(&digest),
        signature: sign(digest),
    }
}

/// Every vector, built by the canister code.
pub fn build() -> VectorFile {
    let key = signing_key();
    VectorFile {
        note: NOTE.to_string(),
        key: KEY.to_string(),
        signer: format_address(&evm_address(&public_key(&key))),
        chain_id: CHAIN_ID,
        token: format_address(&TOKEN),
        endpoint: format_address(&ENDPOINT),
        receive_lib: format_address(&RECEIVE_LIB),
        claims: vec![
            claim(0, RECIPIENT_1, U256::from(100_000_000u64)),
            claim(1, RECIPIENT_1, U256::from(1u8) << 128),
            claim(u64::MAX, RECIPIENT_2, U256::from(123_456_789u64)),
        ],
        executes: vec![
            execute(
                "setMinBurnToIcp(200000000)",
                0,
                1_900_000_000,
                &[EvmAdminAction::SetMinBurnToIcp {
                    amount: Nat::from(200_000_000u64),
                }],
            ),
            execute(
                "setLzReceiveGas(2, 200000); endpoint setConfig on the receive library: ULN for \
                 eid 2 with 20 confirmations and 2 required DVNs; setMinBurnToIcp(300000000)",
                u64::MAX,
                2_000_000_000,
                &[
                    EvmAdminAction::SetLzReceiveGas {
                        dst_eid: PEER_EID,
                        gas: Nat::from(200_000u64),
                    },
                    EvmAdminAction::SetUlnConfig {
                        lib: format_address(&RECEIVE_LIB),
                        eid: PEER_EID,
                        confirmations: 20,
                        required_dvns: vec![format_address(&DVN_1), format_address(&DVN_2)],
                        optional_dvns: vec![],
                        optional_threshold: 0,
                    },
                    EvmAdminAction::SetMinBurnToIcp {
                        amount: Nat::from(300_000_000u64),
                    },
                ],
            ),
        ],
    }
}

pub fn load() -> VectorFile {
    let text =
        std::fs::read_to_string(PATH).unwrap_or_else(|e| panic!("{PATH}: {e}; run write_vectors"));
    serde_json::from_str(&text).unwrap()
}

fn render(file: &VectorFile) -> String {
    let mut text = serde_json::to_string_pretty(file).unwrap();
    text.push('\n');
    text
}

#[test]
#[ignore = "writes evm/gldt-bridge/test/vectors/eip712.json"]
fn write_vectors() {
    let path = std::path::Path::new(PATH);
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    std::fs::write(path, render(&build())).unwrap();
}

#[test]
fn vector_file_is_up_to_date() {
    let on_disk =
        std::fs::read_to_string(PATH).unwrap_or_else(|e| panic!("{PATH}: {e}; run write_vectors"));
    assert_eq!(on_disk, render(&build()), "run write_vectors");
}
