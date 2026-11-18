//! Reading Ethereum and Base.
//!
//! - The head block comes from one unreplicated HTTPS outcall to the chain's `head_rpc_url`.
//!   It can only change timing: a wrong head makes a later call fail or wait.
//! - `bridgeInfo()` and the burn logs come from the EVM RPC canister, always at a fixed block
//!   number, from the chain's two providers with `Equality`: both must return the same answer.
//!
//! `evm_rpc_types` values are mapped to the bridge's own types right here, so the rest of the
//! bridge never sees them. Any error, timeout or disagreement is an [RpcError].

use crate::bridge::evm::abi::{
    bridge_info_calldata, decode_bridge_info, BridgeInfo, RawLog, BURNED_TO_ICP_TOPIC,
};
use crate::bridge::evm::address::parse_address;
use async_trait::async_trait;
use candid::Principal;
use evm_rpc_types::{
    BlockTag, CallArgs, ConsensusStrategy, EthMainnetService, EthSepoliaService, GetLogsArgs,
    GetLogsRpcConfig, Hex, Hex20, Hex32, L2MainnetService, LogEntry, MultiRpcResult, Nat256,
    RpcApi, RpcConfig, RpcServices, TransactionRequest,
};
use gldt_swap_common::bridge::{ChainConfig, EvmProvider};
use ic_cdk::call::Call;
use ic_cdk_management_canister::{HttpHeader, HttpMethod, HttpRequestArgs};
use serde::Deserialize;

/// The largest head reply accepted, headers included. A public endpoint answers in about
/// 460 bytes; the rest is room for endpoints that send more headers.
pub const HEAD_RESPONSE_BYTES: u64 = 4_000;

/// The head call goes to one replica. PocketIC 12 serves such calls too, so the integration
/// build sends it the same way.
const HEAD_REPLICATED: Option<bool> = Some(false);

const HEAD_REQUEST: &[u8] = br#"{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}"#;

/// Cycles sent with each EVM RPC canister call. That canister keeps what the call costs and
/// the rest comes back. Both are about 5 times the cost for 2 providers on its 34 node
/// subnet with the response estimates below.
pub const ETH_CALL_CYCLES: u128 = 10_000_000_000;
pub const GET_LOGS_CYCLES: u128 = 30_000_000_000;

/// The expected size of one provider's `eth_call` reply (`bridgeInfo()` is 160 bytes).
const ETH_CALL_RESPONSE_BYTES: u64 = 2_000;
/// The expected size of one log in an `eth_getLogs` reply (about 900 bytes of JSON).
const LOG_RESPONSE_BYTES: u64 = 2_000;

/// `eth_getLogs` spans at most this many blocks, the largest window.
const MAX_BLOCK_RANGE: u32 = 500;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum RpcError {
    /// The call failed or timed out, or the providers disagreed. The tick is tried again.
    Failed(String),
    /// Both providers returned the same answer, but it is not what a GLDT token returns.
    BadAnswer(String),
}

impl RpcError {
    pub fn message(&self) -> &str {
        match self {
            RpcError::Failed(e) | RpcError::BadAnswer(e) => e,
        }
    }
}

#[async_trait(?Send)]
pub trait EvmReader {
    /// The chain's latest block number.
    async fn head_block(&self, chain: &ChainConfig) -> Result<u64, RpcError>;
    /// The token's `bridgeInfo()` at `block`.
    async fn bridge_info(&self, chain: &ChainConfig, block: u64) -> Result<BridgeInfo, RpcError>;
    /// The token's `BurnedToIcp` logs for `ids` between the two blocks, both included.
    async fn burn_logs(
        &self,
        chain: &ChainConfig,
        from_block: u64,
        to_block: u64,
        ids: &[u64],
    ) -> Result<Vec<RawLog>, RpcError>;
}

/// The production reader, through the management canister and the EVM RPC canister.
pub struct IcEvmReader {
    pub evm_rpc: Principal,
}

#[async_trait(?Send)]
impl EvmReader for IcEvmReader {
    async fn head_block(&self, chain: &ChainConfig) -> Result<u64, RpcError> {
        let reply = ic_cdk_management_canister::http_request(&head_request(&chain.head_rpc_url))
            .await
            .map_err(|e| failed(format!("head call: {e}")))?;
        if reply.status != 200u64 {
            return Err(failed(format!("head call: HTTP status {}", reply.status)));
        }
        parse_head(&reply.body)
    }

    async fn bridge_info(&self, chain: &ChainConfig, block: u64) -> Result<BridgeInfo, RpcError> {
        let config = RpcConfig {
            response_size_estimate: Some(ETH_CALL_RESPONSE_BYTES),
            response_consensus: Some(ConsensusStrategy::Equality),
        };
        let args = (
            services(chain).map_err(failed)?,
            Some(config),
            call_args(token(chain)?, block),
        );
        let reply: MultiRpcResult<Hex> = Call::unbounded_wait(self.evm_rpc, "eth_call")
            .with_args(&args)
            .with_cycles(ETH_CALL_CYCLES)
            .await
            .map_err(|e| failed(format!("eth_call: {e}")))?
            .candid()
            .map_err(|e| failed(format!("eth_call reply: {e}")))?;
        let ret = consistent(reply, "eth_call")?;
        decode_bridge_info(ret.as_ref()).map_err(RpcError::BadAnswer)
    }

    async fn burn_logs(
        &self,
        chain: &ChainConfig,
        from_block: u64,
        to_block: u64,
        ids: &[u64],
    ) -> Result<Vec<RawLog>, RpcError> {
        let config = GetLogsRpcConfig {
            response_size_estimate: Some(log_response_bytes(ids.len())),
            response_consensus: Some(ConsensusStrategy::Equality),
            max_block_range: Some(MAX_BLOCK_RANGE),
        };
        let args = (
            services(chain).map_err(failed)?,
            Some(config),
            get_logs_args(token(chain)?, from_block, to_block, ids),
        );
        let reply: MultiRpcResult<Vec<LogEntry>> =
            Call::unbounded_wait(self.evm_rpc, "eth_getLogs")
                .with_args(&args)
                .with_cycles(GET_LOGS_CYCLES)
                .await
                .map_err(|e| failed(format!("eth_getLogs: {e}")))?
                .candid()
                .map_err(|e| failed(format!("eth_getLogs reply: {e}")))?;
        consistent(reply, "eth_getLogs")?
            .into_iter()
            .map(raw_log)
            .collect()
    }
}

fn failed(msg: String) -> RpcError {
    RpcError::Failed(msg)
}

fn token(chain: &ChainConfig) -> Result<[u8; 20], RpcError> {
    parse_address(&chain.token).map_err(|e| failed(format!("token: {e}")))
}

/// The `eth_blockNumber` POST to `url`, sent to one replica.
fn head_request(url: &str) -> HttpRequestArgs {
    HttpRequestArgs {
        url: url.to_string(),
        max_response_bytes: Some(HEAD_RESPONSE_BYTES),
        method: HttpMethod::POST,
        headers: vec![HttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        }],
        body: Some(HEAD_REQUEST.to_vec()),
        transform: None,
        is_replicated: HEAD_REPLICATED,
    }
}

#[derive(Deserialize)]
struct HeadReply {
    result: String,
}

/// The block number in an `eth_blockNumber` reply: `0x` and 1 to 16 hex digits.
fn parse_head(body: &[u8]) -> Result<u64, RpcError> {
    let reply: HeadReply = serde_json::from_slice(body).map_err(|e| {
        failed(format!(
            "head reply {:?}: {e}",
            String::from_utf8_lossy(&body[..body.len().min(200)])
        ))
    })?;
    reply
        .result
        .strip_prefix("0x")
        .filter(|digits| !digits.is_empty() && digits.len() <= 16)
        .and_then(|digits| u64::from_str_radix(digits, 16).ok())
        .ok_or_else(|| {
            failed(format!(
                "head reply: {:?} is not a block number",
                reply.result
            ))
        })
}

/// The chain's two providers as the EVM RPC canister names them. The service family comes
/// from the chain id: Ethereum (1), Sepolia (11155111) and Base (8453) take their built-in
/// providers; two `Custom` providers become `RpcServices::Custom` for the chain id, with no
/// headers. Base Sepolia (84532) has no built-in provider, so it takes custom ones only. A
/// chain's providers are never mixed. `validate_config` checks the config with this mapping.
pub fn services(chain: &ChainConfig) -> Result<RpcServices, String> {
    use EvmProvider::*;
    let custom: Vec<RpcApi> = chain
        .providers
        .iter()
        .filter_map(|p| match p {
            Custom { url } => Some(RpcApi {
                url: url.clone(),
                headers: None,
            }),
            _ => None,
        })
        .collect();
    if !custom.is_empty() {
        if custom.len() != chain.providers.len() {
            return Err("providers must be both built-in or both custom".to_string());
        }
        return Ok(RpcServices::Custom {
            chain_id: chain.chain_id,
            services: custom,
        });
    }
    match chain.chain_id {
        1 => builtin(chain, |p| match p {
            Alchemy => Some(EthMainnetService::Alchemy),
            Ankr => Some(EthMainnetService::Ankr),
            BlockPi => Some(EthMainnetService::BlockPi),
            PublicNode => Some(EthMainnetService::PublicNode),
            Llama => Some(EthMainnetService::Llama),
            Cloudflare => Some(EthMainnetService::Cloudflare),
            Custom { .. } => None,
        })
        .map(|p| RpcServices::EthMainnet(Some(p))),
        11155111 => builtin(chain, |p| match p {
            Alchemy => Some(EthSepoliaService::Alchemy),
            Ankr => Some(EthSepoliaService::Ankr),
            BlockPi => Some(EthSepoliaService::BlockPi),
            PublicNode => Some(EthSepoliaService::PublicNode),
            Llama | Cloudflare | Custom { .. } => None,
        })
        .map(|p| RpcServices::EthSepolia(Some(p))),
        8453 => builtin(chain, |p| match p {
            Alchemy => Some(L2MainnetService::Alchemy),
            Ankr => Some(L2MainnetService::Ankr),
            BlockPi => Some(L2MainnetService::BlockPi),
            PublicNode => Some(L2MainnetService::PublicNode),
            Llama => Some(L2MainnetService::Llama),
            Cloudflare | Custom { .. } => None,
        })
        .map(|p| RpcServices::BaseMainnet(Some(p))),
        id => Err(format!(
            "chain id {id} has no built-in EVM RPC provider; use two custom providers"
        )),
    }
}

/// Every provider of `chain` mapped by `map`; `None` is a provider the family lacks.
fn builtin<T>(
    chain: &ChainConfig,
    map: impl Fn(&EvmProvider) -> Option<T>,
) -> Result<Vec<T>, String> {
    chain
        .providers
        .iter()
        .map(|p| {
            map(p).ok_or_else(|| {
                format!(
                    "{p:?} is not a built-in EVM RPC provider for chain id {}",
                    chain.chain_id
                )
            })
        })
        .collect()
}

/// `bridgeInfo()` on `token` at `block`.
fn call_args(token: [u8; 20], block: u64) -> CallArgs {
    CallArgs {
        transaction: TransactionRequest {
            to: Some(Hex20::from(token)),
            input: Some(Hex::from(bridge_info_calldata())),
            ..Default::default()
        },
        block: Some(BlockTag::Number(Nat256::from(block))),
    }
}

/// The 32-byte topic of a `uint64 indexed burnId`.
fn id_topic(id: u64) -> [u8; 32] {
    let mut topic = [0u8; 32];
    topic[24..].copy_from_slice(&id.to_be_bytes());
    topic
}

/// The token's `BurnedToIcp` logs with one of `ids`, between two fixed blocks.
fn get_logs_args(token: [u8; 20], from_block: u64, to_block: u64, ids: &[u64]) -> GetLogsArgs {
    GetLogsArgs {
        from_block: Some(BlockTag::Number(Nat256::from(from_block))),
        to_block: Some(BlockTag::Number(Nat256::from(to_block))),
        addresses: vec![Hex20::from(token)],
        topics: Some(vec![
            vec![Hex32::from(BURNED_TO_ICP_TOPIC)],
            ids.iter().map(|id| Hex32::from(id_topic(*id))).collect(),
        ]),
    }
}

fn log_response_bytes(ids: usize) -> u64 {
    LOG_RESPONSE_BYTES
        .saturating_mul(ids as u64)
        .saturating_add(ETH_CALL_RESPONSE_BYTES)
}

/// The one answer both providers gave; anything else is an error.
fn consistent<T>(reply: MultiRpcResult<T>, method: &str) -> Result<T, RpcError> {
    match reply {
        MultiRpcResult::Consistent(Ok(value)) => Ok(value),
        MultiRpcResult::Consistent(Err(e)) => Err(failed(format!("{method}: {e}"))),
        MultiRpcResult::Inconsistent(_) => Err(failed(format!("{method}: the providers disagree"))),
    }
}

/// A log as the scraper checks it. A log without a block, transaction or index is pending
/// and is refused.
fn raw_log(entry: LogEntry) -> Result<RawLog, RpcError> {
    let number = |field: &str, value: Option<Nat256>| {
        value
            .ok_or_else(|| failed(format!("eth_getLogs: a log has no {field}")))
            .and_then(|n| {
                u64::try_from(n)
                    .map_err(|_| failed(format!("eth_getLogs: a log {field} is above u64")))
            })
    };
    Ok(RawLog {
        address: entry.address.into(),
        topics: entry.topics.into_iter().map(<[u8; 32]>::from).collect(),
        data: entry.data.into(),
        block_number: number("block number", entry.block_number)?,
        tx_hash: entry
            .transaction_hash
            .ok_or_else(|| failed("eth_getLogs: a log has no transaction hash".to_string()))?
            .into(),
        log_index: number("log index", entry.log_index)?,
        removed: entry.removed,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bridge::config::test_fixtures::chain_config;
    use crate::bridge::evm::abi::{bridge_info_calldata, RawLog, BURNED_TO_ICP_TOPIC};
    use evm_rpc_types::{
        BlockTag, EthMainnetService, EthSepoliaService, Hex, Hex20, Hex32, L2MainnetService,
        LogEntry, MultiRpcResult, Nat256, RpcApi, RpcService, RpcServices, ValidationError,
    };
    use gldt_swap_common::bridge::EvmChain;
    use ic_cdk_management_canister::HttpMethod;

    #[test]
    fn providers_map_to_the_evm_rpc_services_of_the_chain() {
        let eth = chain_config(EvmChain::Ethereum);
        assert_eq!(
            services(&eth),
            Ok(RpcServices::EthMainnet(Some(vec![
                EthMainnetService::Alchemy,
                EthMainnetService::Ankr
            ])))
        );

        let mut base = chain_config(EvmChain::Base);
        base.providers = vec![EvmProvider::PublicNode, EvmProvider::Llama];
        assert_eq!(
            services(&base),
            Ok(RpcServices::BaseMainnet(Some(vec![
                L2MainnetService::PublicNode,
                L2MainnetService::Llama
            ])))
        );
        base.providers = vec![EvmProvider::Alchemy, EvmProvider::Cloudflare];
        assert!(services(&base).is_err());
    }

    #[test]
    fn sepolia_maps_to_eth_sepolia_service() {
        let mut sepolia = chain_config(EvmChain::Ethereum);
        sepolia.chain_id = 11155111;
        sepolia.providers = vec![EvmProvider::BlockPi, EvmProvider::PublicNode];
        assert_eq!(
            services(&sepolia),
            Ok(RpcServices::EthSepolia(Some(vec![
                EthSepoliaService::BlockPi,
                EthSepoliaService::PublicNode
            ])))
        );
        // Sepolia has no Llama or Cloudflare
        sepolia.providers = vec![EvmProvider::Alchemy, EvmProvider::Cloudflare];
        assert!(services(&sepolia).is_err());

        // two custom providers become the canister's custom service for the chain id, with no headers
        let mut base_sepolia = chain_config(EvmChain::Base);
        base_sepolia.chain_id = 84532;
        base_sepolia.providers = vec![
            EvmProvider::Custom {
                url: "https://sepolia.base.org".to_string(),
            },
            EvmProvider::Custom {
                url: "https://base-sepolia-rpc.publicnode.com".to_string(),
            },
        ];
        assert_eq!(
            services(&base_sepolia),
            Ok(RpcServices::Custom {
                chain_id: 84532,
                services: vec![
                    RpcApi {
                        url: "https://sepolia.base.org".to_string(),
                        headers: None,
                    },
                    RpcApi {
                        url: "https://base-sepolia-rpc.publicnode.com".to_string(),
                        headers: None,
                    },
                ],
            })
        );
        // built-in providers don't exist for Base Sepolia
        base_sepolia.providers = vec![EvmProvider::Alchemy, EvmProvider::Ankr];
        assert!(services(&base_sepolia).is_err());
        // and a chain's two providers are never mixed
        base_sepolia.providers = vec![
            EvmProvider::Alchemy,
            EvmProvider::Custom {
                url: "https://sepolia.base.org".to_string(),
            },
        ];
        assert!(services(&base_sepolia).is_err());
    }

    #[test]
    fn head_request_is_one_unreplicated_post() {
        let args = head_request("https://base-rpc.publicnode.com");
        assert_eq!(args.url, "https://base-rpc.publicnode.com");
        assert_eq!(args.method, HttpMethod::POST);
        assert_eq!(args.max_response_bytes, Some(4_000));
        assert_eq!(args.is_replicated, Some(false));
        assert_eq!(args.transform, None);
        let body: serde_json::Value = serde_json::from_slice(&args.body.unwrap()).unwrap();
        assert_eq!(body["method"], "eth_blockNumber");
        assert_eq!(body["jsonrpc"], "2.0");
    }

    #[test]
    fn head_reply_parses_the_hex_quantity() {
        assert_eq!(
            parse_head(br#"{"jsonrpc":"2.0","result":"0x1924457","id":1}"#),
            Ok(0x1924457)
        );
        assert_eq!(
            parse_head(br#"{"jsonrpc":"2.0", "id":1, "result": "0x0"}"#),
            Ok(0)
        );
        assert_eq!(
            parse_head(br#"{"result":"0xffffffffffffffff"}"#),
            Ok(u64::MAX)
        );
        let bad: [&[u8]; 6] = [
            br#"{"jsonrpc":"2.0","id":1,"error":{"code":-32000,"message":"x"}}"#,
            br#"{"result":"1924457"}"#,
            br#"{"result":"0x"}"#,
            br#"{"result":"0x10000000000000000"}"#,
            br#"{"result":"0xg1"}"#,
            b"not json",
        ];
        for body in bad {
            assert!(
                matches!(parse_head(body), Err(RpcError::Failed(_))),
                "{}",
                String::from_utf8_lossy(body)
            );
        }
    }

    fn entry() -> LogEntry {
        LogEntry {
            address: Hex20::from([0x11; 20]),
            topics: vec![Hex32::from([0x22; 32]), Hex32::from([0x23; 32])],
            data: Hex::from(vec![1, 2, 3]),
            block_number: Some(Nat256::from(77u64)),
            transaction_hash: Some(Hex32::from([0x33; 32])),
            transaction_index: Some(Nat256::from(1u64)),
            block_hash: Some(Hex32::from([0x44; 32])),
            log_index: Some(Nat256::from(5u64)),
            removed: true,
        }
    }

    #[test]
    fn log_entries_map_to_raw_logs() {
        assert_eq!(
            raw_log(entry()),
            Ok(RawLog {
                address: [0x11; 20],
                topics: vec![[0x22; 32], [0x23; 32]],
                data: vec![1, 2, 3],
                block_number: 77,
                tx_hash: [0x33; 32],
                log_index: 5,
                removed: true,
            })
        );

        // a pending log has no block number, hash or index
        let pending = [
            LogEntry {
                block_number: None,
                ..entry()
            },
            LogEntry {
                transaction_hash: None,
                ..entry()
            },
            LogEntry {
                log_index: None,
                ..entry()
            },
            LogEntry {
                block_number: Some(Nat256::from(u128::MAX)),
                ..entry()
            },
        ];
        for entry in pending {
            assert!(matches!(raw_log(entry), Err(RpcError::Failed(_))));
        }
    }

    #[test]
    fn only_a_consistent_ok_answer_is_used() {
        assert_eq!(
            consistent(MultiRpcResult::Consistent(Ok(7u64)), "eth_call"),
            Ok(7)
        );

        let failed = MultiRpcResult::<u64>::Consistent(Err(
            evm_rpc_types::RpcError::ValidationError(ValidationError::Custom("x".into())),
        ));
        assert!(
            matches!(consistent(failed, "eth_call"), Err(RpcError::Failed(e)) if e.contains("eth_call"))
        );

        let disagree = MultiRpcResult::Inconsistent(vec![
            (RpcService::EthMainnet(EthMainnetService::Alchemy), Ok(1u64)),
            (RpcService::EthMainnet(EthMainnetService::Ankr), Ok(2u64)),
        ]);
        assert!(
            matches!(consistent(disagree, "eth_getLogs"), Err(RpcError::Failed(e)) if e.contains("disagree"))
        );
    }

    #[test]
    fn burn_id_topics_are_left_padded_words() {
        let topic = id_topic(0x0102);
        assert_eq!(&topic[..30], &[0u8; 30]);
        assert_eq!(&topic[30..], &[1, 2]);
        assert_eq!(&id_topic(u64::MAX)[..24], &[0u8; 24]);
        assert_eq!(&id_topic(u64::MAX)[24..], &[0xff; 8]);
    }

    #[test]
    fn log_request_names_the_token_the_event_the_ids_and_fixed_blocks() {
        let args = get_logs_args([0xAA; 20], 101, 600, &[49, 50]);
        assert_eq!(
            args.from_block,
            Some(BlockTag::Number(Nat256::from(101u64)))
        );
        assert_eq!(args.to_block, Some(BlockTag::Number(Nat256::from(600u64))));
        assert_eq!(args.addresses, vec![Hex20::from([0xAA; 20])]);
        assert_eq!(
            args.topics,
            Some(vec![
                vec![Hex32::from(BURNED_TO_ICP_TOPIC)],
                vec![Hex32::from(id_topic(49)), Hex32::from(id_topic(50))],
            ])
        );
        // the response estimate grows with the ids asked for
        assert!(log_response_bytes(50) > log_response_bytes(1));
    }

    #[test]
    fn bridge_info_is_read_at_a_fixed_block() {
        let args = call_args([0xAA; 20], 600);
        assert_eq!(args.block, Some(BlockTag::Number(Nat256::from(600u64))));
        assert_eq!(args.transaction.to, Some(Hex20::from([0xAA; 20])));
        assert_eq!(
            args.transaction.input,
            Some(Hex::from(bridge_info_calldata()))
        );
        assert_eq!(args.transaction.from, None);
        assert_eq!(args.transaction.value, None);
    }
}
