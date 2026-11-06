//! The Solidity ABI the canister speaks: the GLDT token (`evm/gldt-bridge/src/IGLDT.sol`) and
//! the four LayerZero endpoint functions an admin action may call (spec 6.6 and 8.9).
//!
//! Every decoder here is strict: a word with dirty high bytes, a missing or extra byte, or a
//! wrong topic count is an `Err`, never a truncated value or a panic.

use crate::bridge::evm::address::parse_address;
use crate::bridge::evm::num::nat_to_u256;
use crate::bridge::evm::principal::decode_icp_account;
use alloy_primitives::{Address, FixedBytes, U256};
use alloy_sol_types::abi::AbiDecoderConfig;
use alloy_sol_types::{sol, SolCall, SolEvent, SolValue};
use candid::Nat;
use gldt_swap_common::bridge::EvmAdminAction;
use icrc_ledger_types::icrc1::account::Account;

sol! {
    /// The part of `IGLDT.sol` the canister encodes or decodes, plus the inherited `setPeer`.
    interface IGLDT {
        event BurnedToIcp(
            uint64 indexed burnId,
            address indexed from,
            bytes32 icpPrincipal,
            bytes32 icpSubaccount,
            uint256 amount
        );

        function setPaused(bool lzPaused, bool icpBridgePaused) external;
        function setLzReceiveGas(uint32 dstEid, uint128 gas) external;
        function setOperator(address newOperator) external;
        function setIcpSigner(address signer) external;
        function setAdminSigner(address signer) external;
        function setMinBurnToIcp(uint256 amount) external;
        function upgradeExact(address implementation, bytes32 codeHash) external;
        function cancelNonce(uint256 nonce) external;
        function setPeer(uint32 eid, bytes32 peer) external;
        function bridgeInfo()
            external
            view
            returns (
                uint64 nextBurnId,
                uint256 totalSupply,
                address owner,
                address adminSigner,
                address icpSigner
            );
    }

    /// LayerZero's `SetConfigParam` (IMessageLibManager.sol).
    struct SetConfigParam {
        uint32 eid;
        uint32 configType;
        bytes config;
    }

    /// LayerZero's ULN config (UlnBase.sol).
    struct UlnConfig {
        uint64 confirmations;
        uint8 requiredDVNCount;
        uint8 optionalDVNCount;
        uint8 optionalDVNThreshold;
        address[] requiredDVNs;
        address[] optionalDVNs;
    }

    /// LayerZero's executor config (SendLibBase.sol).
    struct ExecutorConfig {
        uint32 maxMessageSize;
        address executor;
    }

    /// The only endpoint functions `execute` lets a call reach.
    interface ILayerZeroEndpointV2 {
        function setConfig(address oapp, address lib, SetConfigParam[] params) external;
        function setSendLibrary(address oapp, uint32 eid, address newLib) external;
        function setReceiveLibrary(address oapp, uint32 eid, address newLib, uint256 gracePeriod) external;
        function burn(address oapp, uint32 srcEid, bytes32 sender, uint64 nonce, bytes32 payloadHash) external;
    }
}

/// `keccak256("BurnedToIcp(uint64,address,bytes32,bytes32,uint256)")`, topic 0 of every burn log.
pub const BURNED_TO_ICP_TOPIC: [u8; 32] = IGLDT::BurnedToIcp::SIGNATURE_HASH.0;

const CONFIG_TYPE_EXECUTOR: u32 = 1;
const CONFIG_TYPE_ULN: u32 = 2;
/// LayerZero's "none" DVN count. 0 would mean "use the default", which may change.
const NIL_DVN_COUNT: u8 = u8::MAX;
/// The ULN's `MAX_COUNT`: `(type(uint8).max - 1) / 2`.
const MAX_DVN_COUNT: usize = 127;

/// Everything `bridgeInfo()` returns.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct BridgeInfo {
    pub next_burn_id: u64,
    pub total_supply: U256,
    pub owner: [u8; 20],
    pub admin_signer: [u8; 20],
    pub icp_signer: [u8; 20],
}

/// One log as `eth_getLogs` returns it.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RawLog {
    pub address: [u8; 20],
    pub topics: Vec<[u8; 32]>,
    pub data: Vec<u8>,
    pub block_number: u64,
    pub tx_hash: [u8; 32],
    pub log_index: u64,
    pub removed: bool,
}

/// A `BurnedToIcp` event. The amount is the full `uint256`, never truncated.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DecodedBurn {
    pub burn_id: u64,
    pub from: [u8; 20],
    pub to: Account,
    pub amount: U256,
}

/// One call of an admin action: `(target, calldata)`.
pub type TargetedCall = ([u8; 20], Vec<u8>);

/// Rejects dirty high bytes and trailing bytes.
fn strict() -> AbiDecoderConfig {
    AbiDecoderConfig::new().strict(true)
}

/// The calls for one typed admin action, as `(target, calldata)`, following the table in
/// spec 8.9. Token functions go to `token`; endpoint functions go to `endpoint` with `token`
/// as the OApp.
///
/// It rejects what can't be encoded as given: text that is not an address or a 32-byte hash,
/// numbers that don't fit, zero addresses (`SetOperator { operator: None }` is the one zero),
/// and LayerZero zeros that mean "use the default". ULN DVN lists must be sorted ascending
/// with no duplicates, as the ULN requires; they are never reordered, so the calldata matches
/// what voters read. Policy checks (gas bounds, a minimum above 0, validity, the chain) are the
/// SNS validator's (Task 10).
pub fn encode_call(
    action: &EvmAdminAction,
    token: [u8; 20],
    endpoint: [u8; 20],
) -> Result<Vec<TargetedCall>, String> {
    let oapp = Address::from(token);
    let call = match action {
        EvmAdminAction::SetPaused {
            lz_paused,
            icp_bridge_paused,
        } => (
            token,
            IGLDT::setPausedCall {
                lzPaused: *lz_paused,
                icpBridgePaused: *icp_bridge_paused,
            }
            .abi_encode(),
        ),
        EvmAdminAction::SetLzReceiveGas { dst_eid, gas } => (
            token,
            IGLDT::setLzReceiveGasCall {
                dstEid: *dst_eid,
                gas: u128::try_from(&gas.0).map_err(|_| format!("gas {gas} is above 2^128 - 1"))?,
            }
            .abi_encode(),
        ),
        EvmAdminAction::SetOperator { operator } => {
            let new_operator = match operator {
                None => Address::ZERO,
                Some(text) => nonzero_address(text, "operator")?,
            };
            (
                token,
                IGLDT::setOperatorCall {
                    newOperator: new_operator,
                }
                .abi_encode(),
            )
        }
        EvmAdminAction::SetIcpSigner { signer } => (
            token,
            IGLDT::setIcpSignerCall {
                signer: nonzero_address(signer, "signer")?,
            }
            .abi_encode(),
        ),
        EvmAdminAction::SetAdminSigner { signer } => (
            token,
            IGLDT::setAdminSignerCall {
                signer: nonzero_address(signer, "signer")?,
            }
            .abi_encode(),
        ),
        EvmAdminAction::SetMinBurnToIcp { amount } => (
            token,
            IGLDT::setMinBurnToIcpCall {
                amount: uint256(amount, "amount")?,
            }
            .abi_encode(),
        ),
        EvmAdminAction::SetPeer { eid, peer } => (
            token,
            IGLDT::setPeerCall {
                eid: *eid,
                peer: address_word(peer, "peer")?,
            }
            .abi_encode(),
        ),
        EvmAdminAction::SetSendLibrary { eid, lib } => (
            endpoint,
            ILayerZeroEndpointV2::setSendLibraryCall {
                oapp,
                eid: *eid,
                newLib: nonzero_address(lib, "lib")?,
            }
            .abi_encode(),
        ),
        EvmAdminAction::SetReceiveLibrary {
            eid,
            lib,
            grace_period,
        } => (
            endpoint,
            ILayerZeroEndpointV2::setReceiveLibraryCall {
                oapp,
                eid: *eid,
                newLib: nonzero_address(lib, "lib")?,
                gracePeriod: uint256(grace_period, "grace_period")?,
            }
            .abi_encode(),
        ),
        EvmAdminAction::SetUlnConfig {
            lib,
            eid,
            confirmations,
            required_dvns,
            optional_dvns,
            optional_threshold,
        } => {
            if *confirmations == 0 {
                return Err("confirmations must be above 0 (0 means the LayerZero default)".into());
            }
            let required = dvn_list(required_dvns, "required_dvns")?;
            if required.is_empty() {
                return Err("at least one required DVN".into());
            }
            let optional = dvn_list(optional_dvns, "optional_dvns")?;
            let optional_count = if optional.is_empty() {
                if *optional_threshold != 0 {
                    return Err("optional_threshold must be 0 without optional DVNs".into());
                }
                NIL_DVN_COUNT
            } else {
                if *optional_threshold == 0 || *optional_threshold as usize > optional.len() {
                    return Err(format!(
                        "optional_threshold {optional_threshold} is not 1 to {}",
                        optional.len()
                    ));
                }
                // at most MAX_DVN_COUNT, so it fits a u8
                optional.len() as u8
            };
            let config = UlnConfig {
                confirmations: *confirmations,
                requiredDVNCount: required.len() as u8,
                optionalDVNCount: optional_count,
                optionalDVNThreshold: *optional_threshold,
                requiredDVNs: required,
                optionalDVNs: optional,
            };
            (
                endpoint,
                set_config(
                    oapp,
                    nonzero_address(lib, "lib")?,
                    *eid,
                    CONFIG_TYPE_ULN,
                    config.abi_encode(),
                ),
            )
        }
        EvmAdminAction::SetExecutorConfig {
            lib,
            eid,
            max_message_size,
            executor,
        } => {
            if *max_message_size == 0 {
                return Err(
                    "max_message_size must be above 0 (0 means the LayerZero default)".into(),
                );
            }
            let config = ExecutorConfig {
                maxMessageSize: *max_message_size,
                executor: nonzero_address(executor, "executor")?,
            };
            (
                endpoint,
                set_config(
                    oapp,
                    nonzero_address(lib, "lib")?,
                    *eid,
                    CONFIG_TYPE_EXECUTOR,
                    config.abi_encode(),
                ),
            )
        }
        EvmAdminAction::BurnLzMessage {
            src_eid,
            sender,
            nonce,
            payload_hash,
        } => (
            endpoint,
            ILayerZeroEndpointV2::burnCall {
                oapp,
                srcEid: *src_eid,
                sender: address_word(sender, "sender")?,
                nonce: *nonce,
                payloadHash: hash32(payload_hash, "payload_hash")?,
            }
            .abi_encode(),
        ),
        EvmAdminAction::Upgrade {
            implementation,
            code_hash,
        } => (
            token,
            IGLDT::upgradeExactCall {
                implementation: nonzero_address(implementation, "implementation")?,
                codeHash: hash32(code_hash, "code_hash")?,
            }
            .abi_encode(),
        ),
        EvmAdminAction::CancelNonce { nonce } => (
            token,
            IGLDT::cancelNonceCall {
                nonce: U256::from(*nonce),
            }
            .abi_encode(),
        ),
    };
    Ok(vec![call])
}

/// `setConfig(oapp, lib, [{eid, config_type, config}])`, where `config` is `abi.encode` of
/// the ULN or executor config.
fn set_config(oapp: Address, lib: Address, eid: u32, config_type: u32, config: Vec<u8>) -> Vec<u8> {
    ILayerZeroEndpointV2::setConfigCall {
        oapp,
        lib,
        params: vec![SetConfigParam {
            eid,
            configType: config_type,
            config: config.into(),
        }],
    }
    .abi_encode()
}

fn nonzero_address(text: &str, what: &str) -> Result<Address, String> {
    let address = parse_address(text).map_err(|e| format!("{what}: {e}"))?;
    if address == [0u8; 20] {
        return Err(format!("{what} is the zero address"));
    }
    Ok(Address::from(address))
}

/// An EVM address left-padded to `bytes32`, as LayerZero stores peers and senders.
fn address_word(text: &str, what: &str) -> Result<FixedBytes<32>, String> {
    Ok(nonzero_address(text, what)?.into_word())
}

/// `0x` and exactly 64 hex digits.
fn hash32(text: &str, what: &str) -> Result<FixedBytes<32>, String> {
    let digits = text
        .strip_prefix("0x")
        .ok_or_else(|| format!("{what}: {text:?} does not start with 0x"))?;
    let mut out = [0u8; 32];
    if digits.len() != 64 {
        return Err(format!("{what}: {text:?} is not 0x and 64 hex digits"));
    }
    alloy_primitives::hex::decode_to_slice(digits, &mut out)
        .map_err(|e| format!("{what}: {text:?} is not hex: {e}"))?;
    Ok(FixedBytes(out))
}

fn uint256(n: &Nat, what: &str) -> Result<U256, String> {
    nat_to_u256(n).ok_or_else(|| format!("{what} {n} is above 2^256 - 1"))
}

/// Nonzero addresses, strictly ascending (sorted, no duplicates), at most `MAX_DVN_COUNT`.
fn dvn_list(texts: &[String], what: &str) -> Result<Vec<Address>, String> {
    if texts.len() > MAX_DVN_COUNT {
        return Err(format!("{what}: at most {MAX_DVN_COUNT} DVNs"));
    }
    let dvns = texts
        .iter()
        .map(|text| nonzero_address(text, what))
        .collect::<Result<Vec<_>, _>>()?;
    if dvns.windows(2).any(|pair| pair[0] >= pair[1]) {
        return Err(format!(
            "{what} must be sorted ascending with no duplicates"
        ));
    }
    Ok(dvns)
}

/// The calldata of `bridgeInfo()`.
pub fn bridge_info_calldata() -> Vec<u8> {
    IGLDT::bridgeInfoCall {}.abi_encode()
}

/// The return data of `bridgeInfo()`: exactly five clean words.
pub fn decode_bridge_info(ret: &[u8]) -> Result<BridgeInfo, String> {
    let r = IGLDT::bridgeInfoCall::abi_decode_returns_with_config(ret, strict())
        .map_err(|e| format!("bad bridgeInfo() return: {e}"))?;
    Ok(BridgeInfo {
        next_burn_id: r.nextBurnId,
        total_supply: r.totalSupply,
        owner: r.owner.into_array(),
        admin_signer: r.adminSigner.into_array(),
        icp_signer: r.icpSigner.into_array(),
    })
}

/// A `BurnedToIcp` log from `token`. Rejects a removed log, a log from any other address,
/// any other event, and anything not encoded exactly as the contract emits it, including an
/// ICP account the contract would not accept. The block range is the scraper's check.
pub fn decode_burn_log(log: &RawLog, token: [u8; 20]) -> Result<DecodedBurn, String> {
    if log.removed {
        return Err("the log was removed by a reorg".into());
    }
    if log.address != token {
        return Err(format!(
            "the log is from {}, not the token",
            Address::from(log.address)
        ));
    }
    if log.topics.first() != Some(&BURNED_TO_ICP_TOPIC) {
        return Err("not a BurnedToIcp log".into());
    }
    let event = IGLDT::BurnedToIcp::decode_raw_log_with_config(
        log.topics.iter().copied(),
        &log.data,
        strict(),
    )
    .map_err(|e| format!("bad BurnedToIcp log: {e}"))?;
    let to = decode_icp_account(event.icpPrincipal.0, event.icpSubaccount.0)?;
    Ok(DecodedBurn {
        burn_id: event.burnId,
        from: event.from.into_array(),
        to,
        amount: event.amount,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::evm::address::format_address;
    use crate::bridge::evm::principal::encode_icp_principal;
    use alloy_primitives::{hex, keccak256, U256};
    use candid::{Nat, Principal};
    use gldt_swap_common::bridge::EvmAdminAction;
    use icrc_ledger_types::icrc1::account::Account;

    const TOKEN: [u8; 20] = hex!("00000000000000000000000000000000000b1d6e");
    const ENDPOINT: [u8; 20] = hex!("1a44076050125825900e736c501f859c50fe728c");
    const LIB: [u8; 20] = hex!("c02ab410f0734efa3f14628780e6e695156024c2");
    const DVN_1: [u8; 20] = hex!("589dedbd617e0cbcb916a9223f4d1300c294236b");
    const DVN_2: [u8; 20] = hex!("a59ba433ac34d2927232918ef5b2eaafcf130ba5");
    const OTHER: [u8; 20] = hex!("70997970c51812dc3a010c7d01b50e0d17dc79c8");

    /// The first 4 bytes of the keccak of a literal Solidity signature (never alloy's own constants).
    fn selector(signature: &str) -> Vec<u8> {
        keccak256(signature.as_bytes())[..4].to_vec()
    }

    fn uint(v: u128) -> [u8; 32] {
        U256::from(v).to_be_bytes()
    }

    fn word(a: [u8; 20]) -> [u8; 32] {
        let mut w = [0u8; 32];
        w[12..].copy_from_slice(&a);
        w
    }

    fn calldata(signature: &str, words: &[[u8; 32]]) -> Vec<u8> {
        let mut out = selector(signature);
        out.extend(words.concat());
        out
    }

    fn text(a: [u8; 20]) -> String {
        format_address(&a)
    }

    fn one(action: EvmAdminAction) -> ([u8; 20], Vec<u8>) {
        let calls = encode_call(&action, TOKEN, ENDPOINT).unwrap();
        assert_eq!(calls.len(), 1, "{action:?}");
        calls[0].clone()
    }

    fn uln_action(
        required: Vec<[u8; 20]>,
        optional: Vec<[u8; 20]>,
        threshold: u8,
    ) -> EvmAdminAction {
        EvmAdminAction::SetUlnConfig {
            lib: text(LIB),
            eid: 30101,
            confirmations: 15,
            required_dvns: required.into_iter().map(text).collect(),
            optional_dvns: optional.into_iter().map(text).collect(),
            optional_threshold: threshold,
        }
    }

    /// `setConfig(token, lib, [{eid, config_type, config}])`, laid out word by word.
    fn set_config_calldata(eid: u32, config_type: u32, config: &[u8]) -> Vec<u8> {
        assert_eq!(config.len() % 32, 0);
        let mut words = vec![
            word(TOKEN),
            word(LIB),
            uint(0x60), // offset of params, after 3 head words
            uint(1),    // params.length
            uint(0x20), // offset of params[0], a dynamic tuple, after the 1 offset word
            uint(eid as u128),
            uint(config_type as u128),
            uint(0x60), // offset of config inside the tuple, after 3 head words
            uint(config.len() as u128),
        ];
        words.extend(config.chunks(32).map(|c| <[u8; 32]>::try_from(c).unwrap()));
        calldata("setConfig(address,address,(uint32,uint32,bytes)[])", &words)
    }

    #[test]
    fn encode_call_matches_selectors_and_args() {
        // SetMinBurnToIcp goes to the token
        assert_eq!(
            one(EvmAdminAction::SetMinBurnToIcp {
                amount: Nat::from(100_000_000u64)
            }),
            (
                TOKEN,
                calldata("setMinBurnToIcp(uint256)", &[uint(100_000_000)])
            )
        );
        // the same selectors as `cast sig`
        for (signature, expected) in [
            ("setMinBurnToIcp(uint256)", "16b4d45a"),
            (
                "setConfig(address,address,(uint32,uint32,bytes)[])",
                "6dbd9f90",
            ),
            ("upgradeExact(address,bytes32)", "a5b9d781"),
            ("bridgeInfo()", "da95e659"),
        ] {
            assert_eq!(hex::encode(selector(signature)), expected);
        }

        // SetUlnConfig goes to the endpoint. abi.encode(UlnConfig) is a dynamic tuple, so it
        // starts with the offset 0x20, like Solidity's abi.encode of a struct.
        let uln = [
            uint(0x20),   // offset of the tuple
            uint(15),     // confirmations
            uint(2),      // requiredDVNCount
            uint(255),    // optionalDVNCount: NIL, none
            uint(0),      // optionalDVNThreshold
            uint(6 * 32), // offset of requiredDVNs, after 6 head words
            uint(9 * 32), // offset of optionalDVNs, after 6 head words, 1 length and 2 addresses
            uint(2),
            word(DVN_1),
            word(DVN_2),
            uint(0),
        ]
        .concat();
        assert_eq!(
            one(uln_action(vec![DVN_1, DVN_2], vec![], 0)),
            (ENDPOINT, set_config_calldata(30101, 2, &uln))
        );

        // with optional DVNs the count is the list length
        let uln = [
            uint(0x20),
            uint(15),
            uint(1),
            uint(1),
            uint(1),
            uint(6 * 32),
            uint(8 * 32),
            uint(1),
            word(DVN_1),
            uint(1),
            word(DVN_2),
        ]
        .concat();
        assert_eq!(
            one(uln_action(vec![DVN_1], vec![DVN_2], 1)),
            (ENDPOINT, set_config_calldata(30101, 2, &uln))
        );

        // SetExecutorConfig: ExecutorConfig is static, so it has no offset word
        assert_eq!(
            one(EvmAdminAction::SetExecutorConfig {
                lib: text(LIB),
                eid: 30184,
                max_message_size: 10_000,
                executor: text(OTHER),
            }),
            (
                ENDPOINT,
                set_config_calldata(30184, 1, &[uint(10_000), word(OTHER)].concat())
            )
        );

        // Upgrade goes to the token as upgradeExact(implementation, codeHash)
        let code_hash = [0xc0u8; 32];
        assert_eq!(
            one(EvmAdminAction::Upgrade {
                implementation: text(OTHER),
                code_hash: format!("0x{}", hex::encode(code_hash)),
            }),
            (
                TOKEN,
                calldata("upgradeExact(address,bytes32)", &[word(OTHER), code_hash])
            )
        );
    }

    #[test]
    fn encode_call_covers_every_action() {
        let hash = [0x5au8; 32];
        let hash_text = format!("0x{}", hex::encode(hash));
        let cases: Vec<(EvmAdminAction, [u8; 20], Vec<u8>)> = vec![
            (
                EvmAdminAction::SetPaused {
                    lz_paused: true,
                    icp_bridge_paused: false,
                },
                TOKEN,
                calldata("setPaused(bool,bool)", &[uint(1), uint(0)]),
            ),
            (
                EvmAdminAction::SetLzReceiveGas {
                    dst_eid: 30184,
                    gas: Nat::from(200_000u64),
                },
                TOKEN,
                calldata(
                    "setLzReceiveGas(uint32,uint128)",
                    &[uint(30184), uint(200_000)],
                ),
            ),
            (
                EvmAdminAction::SetOperator {
                    operator: Some(text(OTHER)),
                },
                TOKEN,
                calldata("setOperator(address)", &[word(OTHER)]),
            ),
            (
                EvmAdminAction::SetOperator { operator: None },
                TOKEN,
                calldata("setOperator(address)", &[[0u8; 32]]),
            ),
            (
                EvmAdminAction::SetIcpSigner {
                    signer: text(OTHER),
                },
                TOKEN,
                calldata("setIcpSigner(address)", &[word(OTHER)]),
            ),
            (
                EvmAdminAction::SetAdminSigner {
                    signer: text(OTHER),
                },
                TOKEN,
                calldata("setAdminSigner(address)", &[word(OTHER)]),
            ),
            (
                EvmAdminAction::SetPeer {
                    eid: 30101,
                    peer: text(OTHER),
                },
                TOKEN,
                calldata("setPeer(uint32,bytes32)", &[uint(30101), word(OTHER)]),
            ),
            (
                EvmAdminAction::SetSendLibrary {
                    eid: 30184,
                    lib: text(LIB),
                },
                ENDPOINT,
                calldata(
                    "setSendLibrary(address,uint32,address)",
                    &[word(TOKEN), uint(30184), word(LIB)],
                ),
            ),
            (
                EvmAdminAction::SetReceiveLibrary {
                    eid: 30184,
                    lib: text(LIB),
                    grace_period: Nat::from(86_400u64),
                },
                ENDPOINT,
                calldata(
                    "setReceiveLibrary(address,uint32,address,uint256)",
                    &[word(TOKEN), uint(30184), word(LIB), uint(86_400)],
                ),
            ),
            (
                EvmAdminAction::BurnLzMessage {
                    src_eid: 30184,
                    sender: text(OTHER),
                    nonce: u64::MAX,
                    payload_hash: hash_text.clone(),
                },
                ENDPOINT,
                calldata(
                    "burn(address,uint32,bytes32,uint64,bytes32)",
                    &[
                        word(TOKEN),
                        uint(30184),
                        word(OTHER),
                        uint(u64::MAX as u128),
                        hash,
                    ],
                ),
            ),
            (
                EvmAdminAction::CancelNonce { nonce: u64::MAX },
                TOKEN,
                calldata("cancelNonce(uint256)", &[uint(u64::MAX as u128)]),
            ),
        ];
        for (action, target, data) in cases {
            assert_eq!(one(action.clone()), (target, data), "{action:?}");
        }

        // the largest values still encode exactly
        let max: Nat = U256::MAX.to_string().parse().unwrap();
        assert_eq!(
            one(EvmAdminAction::SetMinBurnToIcp { amount: max }),
            (TOKEN, calldata("setMinBurnToIcp(uint256)", &[[0xff; 32]]))
        );
        assert_eq!(
            one(EvmAdminAction::SetLzReceiveGas {
                dst_eid: 1,
                gas: Nat::from(u128::MAX)
            })
            .1,
            calldata(
                "setLzReceiveGas(uint32,uint128)",
                &[uint(1), uint(u128::MAX)]
            )
        );
    }

    #[test]
    fn encode_call_rejects_malformed_input() {
        let zero = text([0u8; 20]);
        let bad: Vec<EvmAdminAction> = vec![
            // addresses that don't parse, or are zero
            EvmAdminAction::SetIcpSigner {
                signer: "0x1234".into(),
            },
            EvmAdminAction::SetIcpSigner {
                signer: zero.clone(),
            },
            EvmAdminAction::SetAdminSigner {
                signer: zero.clone(),
            },
            EvmAdminAction::SetAdminSigner {
                // bad EIP-55 checksum
                signer: "0x0a82D20142d067C8AF32f48664bDDfb65EcAE507".into(),
            },
            EvmAdminAction::SetOperator {
                operator: Some(zero.clone()),
            },
            EvmAdminAction::SetPeer {
                eid: 1,
                peer: zero.clone(),
            },
            EvmAdminAction::SetPeer {
                eid: 1,
                // a bytes32 peer is not accepted: the peer is the token on the other EVM chain
                peer: format!("0x{}", hex::encode(word(OTHER))),
            },
            EvmAdminAction::SetSendLibrary {
                eid: 1,
                lib: zero.clone(),
            },
            EvmAdminAction::SetReceiveLibrary {
                eid: 1,
                lib: zero.clone(),
                grace_period: Nat::from(0u8),
            },
            EvmAdminAction::Upgrade {
                implementation: zero.clone(),
                code_hash: format!("0x{}", "11".repeat(32)),
            },
            EvmAdminAction::BurnLzMessage {
                src_eid: 1,
                sender: zero.clone(),
                nonce: 1,
                payload_hash: format!("0x{}", "11".repeat(32)),
            },
            EvmAdminAction::SetExecutorConfig {
                lib: text(LIB),
                eid: 1,
                max_message_size: 10_000,
                executor: zero.clone(),
            },
            // hashes that are not 0x and 32 bytes of hex
            EvmAdminAction::Upgrade {
                implementation: text(OTHER),
                code_hash: format!("0x{}", "11".repeat(31)),
            },
            EvmAdminAction::Upgrade {
                implementation: text(OTHER),
                code_hash: "11".repeat(32),
            },
            EvmAdminAction::Upgrade {
                implementation: text(OTHER),
                code_hash: format!("0x{}", "zz".repeat(32)),
            },
            EvmAdminAction::BurnLzMessage {
                src_eid: 1,
                sender: text(OTHER),
                nonce: 1,
                payload_hash: format!("0x{}", "11".repeat(33)),
            },
            // numbers that don't fit
            EvmAdminAction::SetLzReceiveGas {
                dst_eid: 1,
                gas: Nat::from(u128::MAX) + Nat::from(1u8),
            },
            EvmAdminAction::SetMinBurnToIcp {
                amount: format!("{}0", U256::MAX).parse().unwrap(),
            },
            EvmAdminAction::SetReceiveLibrary {
                eid: 1,
                lib: text(LIB),
                grace_period: format!("{}0", U256::MAX).parse().unwrap(),
            },
            // LayerZero zeros that mean "use the default"
            EvmAdminAction::SetExecutorConfig {
                lib: text(LIB),
                eid: 1,
                max_message_size: 0,
                executor: text(OTHER),
            },
            EvmAdminAction::SetUlnConfig {
                lib: text(LIB),
                eid: 1,
                confirmations: 0,
                required_dvns: vec![text(DVN_1)],
                optional_dvns: vec![],
                optional_threshold: 0,
            },
            uln_action(vec![], vec![], 0),
            uln_action(vec![], vec![DVN_1], 1),
            // DVN lists: sorted ascending, no duplicates, no zero, at most 127
            uln_action(vec![DVN_2, DVN_1], vec![], 0),
            uln_action(vec![DVN_1, DVN_1], vec![], 0),
            uln_action(vec![[0u8; 20], DVN_1], vec![], 0),
            uln_action(vec![DVN_1], vec![DVN_2, DVN_1], 1),
            uln_action(
                (1..=128u8)
                    .map(|i| {
                        let mut a = [0u8; 20];
                        a[19] = i;
                        a
                    })
                    .collect(),
                vec![],
                0,
            ),
            // the threshold: 0 with no optional DVNs, else 1 to their count
            uln_action(vec![DVN_1], vec![], 1),
            uln_action(vec![DVN_1], vec![DVN_2], 0),
            uln_action(vec![DVN_1], vec![DVN_2], 2),
        ];
        for action in bad {
            assert!(encode_call(&action, TOKEN, ENDPOINT).is_err(), "{action:?}");
        }

        // the edges that are fine: 127 required DVNs and a zero grace period
        let many: Vec<[u8; 20]> = (1..=127u8)
            .map(|i| {
                let mut a = [0u8; 20];
                a[19] = i;
                a
            })
            .collect();
        assert!(encode_call(&uln_action(many, vec![], 0), TOKEN, ENDPOINT).is_ok());
        assert!(encode_call(
            &EvmAdminAction::SetReceiveLibrary {
                eid: 1,
                lib: text(LIB),
                grace_period: Nat::from(0u8),
            },
            TOKEN,
            ENDPOINT
        )
        .is_ok());
    }

    #[test]
    fn decode_bridge_info_roundtrip() {
        assert_eq!(bridge_info_calldata(), selector("bridgeInfo()"));

        let owner = TOKEN;
        let admin = hex!("216c1e5f2b9eb767cec5c7d4dfa2d02b5a0aa143");
        let claims = hex!("0a82d20142d067c8af32f48664bddfb65ecae507");
        for (next_burn_id, total_supply) in [
            (0u64, U256::ZERO),
            (7, U256::from(123_456_789u64)),
            (u64::MAX, U256::MAX),
        ] {
            let ret = [
                uint(next_burn_id as u128),
                total_supply.to_be_bytes(),
                word(owner),
                word(admin),
                word(claims),
            ]
            .concat();
            assert_eq!(
                decode_bridge_info(&ret).unwrap(),
                BridgeInfo {
                    next_burn_id,
                    total_supply,
                    owner,
                    admin_signer: admin,
                    icp_signer: claims,
                }
            );
        }

        let good = [uint(7), uint(1), word(owner), word(admin), word(claims)].concat();
        let mut bad: Vec<Vec<u8>> = vec![
            vec![],
            good[..159].to_vec(),
            [good.clone(), vec![0]].concat(),
            [good.clone(), uint(0).to_vec()].concat(),
        ];
        // a dirty high byte in the uint64 word (bytes 0 to 23) and in each address word
        // (bytes 0 to 11)
        for byte in [0usize, 23, 2 * 32, 3 * 32 + 11, 4 * 32] {
            let mut dirty = good.clone();
            dirty[byte] = 1;
            bad.push(dirty);
        }
        for ret in bad {
            assert!(decode_bridge_info(&ret).is_err(), "{}", hex::encode(&ret));
        }
    }

    fn principal() -> Principal {
        Principal::from_text("6f6ua-hqaaa-aaaar-qairq-cai").unwrap()
    }

    fn burn_log(burn_id: u64, amount: U256) -> RawLog {
        RawLog {
            address: TOKEN,
            topics: vec![BURNED_TO_ICP_TOPIC, uint(burn_id as u128), word(OTHER)],
            data: [
                encode_icp_principal(&principal()),
                [3u8; 32],
                amount.to_be_bytes(),
            ]
            .concat(),
            block_number: 100,
            tx_hash: [9; 32],
            log_index: 4,
            removed: false,
        }
    }

    #[test]
    fn burned_to_icp_topic_is_the_event_signature() {
        assert_eq!(
            BURNED_TO_ICP_TOPIC,
            keccak256("BurnedToIcp(uint64,address,bytes32,bytes32,uint256)").0
        );
        // `cast keccak "BurnedToIcp(uint64,address,bytes32,bytes32,uint256)"`
        assert_eq!(
            hex::encode(BURNED_TO_ICP_TOPIC),
            "2fc4b4e788882f9b986e40f4a4154b9da7ec0d050bfa441698e83ae29d789cbe"
        );
    }

    #[test]
    fn decode_burn_log_rejects_wrong_address_topic_or_removed() {
        let good = burn_log(42, U256::from(100_000_000u64));
        assert_eq!(
            decode_burn_log(&good, TOKEN).unwrap(),
            DecodedBurn {
                burn_id: 42,
                from: OTHER,
                to: Account {
                    owner: principal(),
                    subaccount: Some([3; 32]),
                },
                amount: U256::from(100_000_000u64),
            }
        );
        // an all-zero subaccount is the default account
        let mut default_account = good.clone();
        default_account.data[32..64].fill(0);
        assert_eq!(
            decode_burn_log(&default_account, TOKEN)
                .unwrap()
                .to
                .subaccount,
            None
        );

        // another contract's log, or a filter for another token
        let mut other_address = good.clone();
        other_address.address = OTHER;
        assert!(decode_burn_log(&other_address, TOKEN).is_err());
        assert!(decode_burn_log(&good, OTHER).is_err());

        // another event with the same shape
        let mut other_topic = good.clone();
        other_topic.topics[0] = keccak256("ClaimedFromIcp(uint64,address,uint256)").0;
        assert!(decode_burn_log(&other_topic, TOKEN).is_err());

        // a log a reorg removed
        let mut removed = good.clone();
        removed.removed = true;
        assert!(decode_burn_log(&removed, TOKEN).is_err());

        let mut bad: Vec<RawLog> = Vec::new();
        // 0, 2 and 4 topics
        for topics in [
            vec![],
            good.topics[..2].to_vec(),
            [good.topics.clone(), vec![[0u8; 32]]].concat(),
        ] {
            let mut log = good.clone();
            log.topics = topics;
            bad.push(log);
        }
        // a dirty high byte in the burnId topic and in the from topic
        for (topic, byte) in [(1usize, 0usize), (1, 23), (2, 0), (2, 11)] {
            let mut log = good.clone();
            log.topics[topic][byte] = 1;
            bad.push(log);
        }
        // data of 0, 95 and 97 bytes
        for data in [
            vec![],
            good.data[..95].to_vec(),
            [good.data.clone(), vec![0]].concat(),
        ] {
            let mut log = good.clone();
            log.data = data;
            bad.push(log);
        }
        // an ICP principal the contract would not have accepted
        let mut bad_principal = good.clone();
        bad_principal.data[0] = 30;
        bad.push(bad_principal);
        let mut trailing = good.clone();
        trailing.data[31] = 1;
        bad.push(trailing);

        for log in bad {
            assert!(decode_burn_log(&log, TOKEN).is_err(), "{log:?}");
        }
    }

    #[test]
    fn decode_burn_log_amount_above_u128_is_kept_as_u256() {
        let two_pow_128 = U256::from(1u8) << 128;
        for amount in [two_pow_128, U256::MAX] {
            let decoded = decode_burn_log(&burn_log(u64::MAX, amount), TOKEN).unwrap();
            assert_eq!(decoded.amount, amount);
            assert_eq!(decoded.burn_id, u64::MAX);
        }
        assert_eq!(
            two_pow_128.to_string(),
            "340282366920938463463374607431768211456"
        );
    }
}
