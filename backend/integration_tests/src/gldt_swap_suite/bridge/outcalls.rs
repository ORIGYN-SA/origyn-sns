//! HTTPS outcalls in PocketIC: gldt_swap's head call and the EVM RPC canister's `eth_call` and
//! `eth_getLogs`, answered as JSON-RPC nodes would. Requests are told apart by their JSON-RPC
//! method and parameters. The URL host only tells the providers apart, for tests that make them
//! disagree.

use candid::Principal;
use pocket_ic::common::rest::{
    CanisterHttpHeader, CanisterHttpReply, CanisterHttpRequest, CanisterHttpResponse,
    MockCanisterHttpResponse,
};
use pocket_ic::PocketIc;
use serde_json::{json, Value};
use std::collections::BTreeMap;

/// `serve_outcalls` stops after this many rounds without a pending outcall.
const IDLE_ROUNDS: usize = 10;
const MAX_ROUNDS: usize = 300;

/// Ticks and answers every outcall that becomes pending with `handler`, until none has been
/// pending for a few rounds.
pub fn serve_outcalls(
    pic: &PocketIc,
    handler: impl Fn(&CanisterHttpRequest) -> CanisterHttpResponse,
) {
    let mut idle = 0;
    for _ in 0..MAX_ROUNDS {
        pic.tick();
        let requests = pic.get_canister_http();
        if requests.is_empty() {
            idle += 1;
            if idle >= IDLE_ROUNDS {
                return;
            }
            continue;
        }
        idle = 0;
        for request in requests {
            let response = handler(&request);
            pic.mock_canister_http_response(MockCanisterHttpResponse {
                subnet_id: request.subnet_id,
                request_id: request.request_id,
                response,
                additional_responses: vec![],
            });
        }
    }
    panic!("outcalls were still pending after {MAX_ROUNDS} rounds");
}

/// The JSON-RPC method of a request, such as `eth_getLogs`.
pub fn rpc_method(request: &CanisterHttpRequest) -> String {
    let body: Value = serde_json::from_slice(&request.body).expect("a JSON-RPC request");
    body["method"].as_str().unwrap_or_default().to_string()
}

/// The burn ids an `eth_getLogs` request asks for, in its order.
pub fn requested_burn_ids(request: &CanisterHttpRequest) -> Vec<u64> {
    let body: Value = serde_json::from_slice(&request.body).expect("a JSON-RPC request");
    all(&body["params"][0]["topics"][1])
        .iter()
        .map(|t| topic_u64(t))
        .collect()
}

/// A node's JSON-RPC error for `request`.
pub fn node_error(request: &CanisterHttpRequest, message: &str) -> CanisterHttpResponse {
    let body: Value = serde_json::from_slice(&request.body).expect("a JSON-RPC request");
    rpc_error(body["id"].clone(), -32000, message)
}

/// Which provider a request goes to: `alchemy`, `ankr`, or `other` (the head endpoint).
pub fn provider(request: &CanisterHttpRequest) -> &'static str {
    if request.url.contains("alchemy") {
        "alchemy"
    } else if request.url.contains("ankr") {
        "ankr"
    } else {
        "other"
    }
}

/// `keccak256("BurnedToIcp(uint64,address,bytes32,bytes32,uint256)")`, built here rather than
/// taken from the canister.
pub fn burned_to_icp_topic() -> String {
    format!(
        "0x{}",
        hex::encode(alloy_primitives::keccak256(
            b"BurnedToIcp(uint64,address,bytes32,bytes32,uint256)"
        ))
    )
}

/// One `BurnedToIcp` burn on a mocked token.
#[derive(Clone, Debug)]
pub struct MockBurn {
    pub burn_id: u64,
    pub block: u64,
    pub to: Principal,
    pub amount: u128,
}

#[derive(Clone, Debug, Default)]
pub struct MockToken {
    pub next_burn_id: u64,
    pub total_supply: u128,
    pub burns: Vec<MockBurn>,
}

/// Ethereum and Base as the mocked nodes see them. Both chains share the head; the tokens
/// have different addresses.
#[derive(Clone, Debug, Default)]
pub struct MockEvm {
    /// What `eth_blockNumber` answers.
    pub head: u64,
    /// The newest block that exists: a call at a later block fails, as on a node.
    pub chain_head: u64,
    /// The canister's addresses, set as each token's `icpSigner` and `adminSigner`.
    pub claims: String,
    pub admin: String,
    /// By lower case token address.
    pub tokens: BTreeMap<String, MockToken>,
}

impl MockEvm {
    /// Tokens with no burn and no supply, owned by themselves, with the canister's signers.
    pub fn new(head: u64, claims: &str, admin: &str, tokens: &[&str]) -> Self {
        Self {
            head,
            chain_head: head,
            claims: claims.to_string(),
            admin: admin.to_string(),
            tokens: tokens
                .iter()
                .map(|t| (t.to_lowercase(), MockToken::default()))
                .collect(),
        }
    }

    pub fn token_mut(&mut self, token: &str) -> &mut MockToken {
        self.tokens
            .get_mut(&token.to_lowercase())
            .unwrap_or_else(|| panic!("no mocked token {token}"))
    }

    /// New blocks: the head and the chain move on together.
    pub fn advance(&mut self, blocks: u64) {
        self.head += blocks;
        self.chain_head += blocks;
    }

    /// A burn to `to` in the newest block; returns its burn id.
    pub fn burn(&mut self, token: &str, to: Principal, amount: u128) -> u64 {
        let block = self.chain_head;
        let token = self.token_mut(token);
        let burn_id = token.next_burn_id;
        token.next_burn_id += 1;
        token.burns.push(MockBurn {
            burn_id,
            block,
            to,
            amount,
        });
        burn_id
    }

    /// What an honest node answers.
    pub fn answer(&self, request: &CanisterHttpRequest) -> CanisterHttpResponse {
        let body: Value = serde_json::from_slice(&request.body).expect("a JSON-RPC request");
        let id = body["id"].clone();
        let params = &body["params"];
        match body["method"].as_str() {
            Some("eth_blockNumber") => rpc_result(id, json!(quantity(self.head))),
            Some("eth_call") => {
                let block = parse_quantity(&params[1]);
                if block > self.chain_head {
                    return rpc_error(id, -32000, "header not found");
                }
                let to = params[0]["to"].as_str().unwrap().to_lowercase();
                match self.tokens.get(&to) {
                    Some(token) => rpc_result(
                        id,
                        json!(bridge_info(
                            token.next_burn_id,
                            token.total_supply,
                            &to,
                            &self.admin,
                            &self.claims
                        )),
                    ),
                    // no contract at this address
                    None => rpc_result(id, json!("0x")),
                }
            }
            Some("eth_getLogs") => {
                let filter = &params[0];
                let from = parse_quantity(&filter["fromBlock"]);
                let to = parse_quantity(&filter["toBlock"]);
                if to > self.chain_head {
                    return rpc_error(id, -32000, "block range extends beyond current head block");
                }
                let address = one_or_first(&filter["address"]).to_lowercase();
                let topics = filter["topics"].as_array().expect("topics");
                assert_eq!(one_or_first(&topics[0]), burned_to_icp_topic());
                let ids: Vec<u64> = all(&topics[1]).iter().map(|t| topic_u64(t)).collect();
                let logs: Vec<Value> = self
                    .tokens
                    .get(&address)
                    .map(|token| {
                        token
                            .burns
                            .iter()
                            .filter(|b| ids.contains(&b.burn_id) && (from..=to).contains(&b.block))
                            .map(|b| log_json(&address, b))
                            .collect()
                    })
                    .unwrap_or_default();
                rpc_result(id, Value::Array(logs))
            }
            other => panic!("unexpected JSON-RPC request {other:?}: {body}"),
        }
    }
}

fn quantity(n: u64) -> String {
    format!("{n:#x}")
}

fn parse_quantity(v: &Value) -> u64 {
    let text = v.as_str().expect("a hex quantity");
    u64::from_str_radix(text.trim_start_matches("0x"), 16).expect("a hex quantity")
}

/// A JSON-RPC field that is a string or a list of strings: the string, or the first one.
fn one_or_first(v: &Value) -> String {
    all(v).into_iter().next().expect("a value")
}

fn all(v: &Value) -> Vec<String> {
    match v {
        Value::String(s) => vec![s.clone()],
        Value::Array(items) => items
            .iter()
            .map(|i| i.as_str().unwrap().to_string())
            .collect(),
        other => panic!("not a string or a list: {other}"),
    }
}

fn topic_u64(topic: &str) -> u64 {
    let hex = topic.trim_start_matches("0x");
    u64::from_str_radix(&hex[hex.len() - 16..], 16).unwrap()
}

/// A 32-byte word of a number, as 64 hex digits.
fn word(n: u128) -> String {
    format!("{n:064x}")
}

/// A 32-byte word of an address, as 64 hex digits.
fn address_word(address: &str) -> String {
    format!("{:0>64}", address.trim_start_matches("0x").to_lowercase())
}

/// `bridgeInfo()` returns `(uint64 nextBurnId, uint256 totalSupply, address owner,
/// address adminSigner, address icpSigner)`.
pub fn bridge_info(
    next_burn_id: u64,
    total_supply: u128,
    owner: &str,
    admin: &str,
    icp_signer: &str,
) -> String {
    format!(
        "0x{}{}{}{}{}",
        word(next_burn_id as u128),
        word(total_supply),
        address_word(owner),
        address_word(admin),
        address_word(icp_signer)
    )
}

/// The ICP principal as the contract takes it: its length, its bytes, then zeros.
fn principal_word(p: &Principal) -> String {
    let bytes = p.as_slice();
    let mut word = vec![bytes.len() as u8];
    word.extend_from_slice(bytes);
    word.resize(32, 0);
    hex::encode(word)
}

fn log_json(token: &str, burn: &MockBurn) -> Value {
    let from = "0x00000000000000000000000000000000000f0f0f";
    json!({
        "address": token,
        "topics": [
            burned_to_icp_topic(),
            format!("0x{}", word(burn.burn_id as u128)),
            format!("0x{}", address_word(from)),
        ],
        "data": format!("0x{}{}{}", principal_word(&burn.to), word(0), word(burn.amount)),
        "blockNumber": quantity(burn.block),
        "transactionHash": format!("0x{}", word(((burn.block as u128) << 64) | burn.burn_id as u128)),
        "transactionIndex": "0x0",
        "blockHash": format!("0x{}", word(burn.block as u128 + 1)),
        "logIndex": quantity(burn.burn_id),
        "removed": false,
    })
}

fn reply(body: Value) -> CanisterHttpResponse {
    CanisterHttpResponse::CanisterHttpReply(CanisterHttpReply {
        status: 200,
        headers: vec![CanisterHttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        }],
        body: body.to_string().into_bytes(),
    })
}

pub fn rpc_result(id: Value, result: Value) -> CanisterHttpResponse {
    reply(json!({ "jsonrpc": "2.0", "id": id, "result": result }))
}

pub fn rpc_error(id: Value, code: i64, message: &str) -> CanisterHttpResponse {
    reply(json!({ "jsonrpc": "2.0", "id": id, "error": { "code": code, "message": message } }))
}
