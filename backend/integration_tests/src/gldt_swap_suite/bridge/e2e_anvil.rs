//! End to end against a local anvil chain. `DeployLocal.s.sol` deploys the
//! LayerZero test stack and GLDT with the canister's two addresses as signers, and every PocketIC
//! outcall (gldt_swap's head call and the EVM RPC canister's calls) goes to anvil. A
//! `bridge_to_evm` voucher claims on anvil through `cast send`, a `burnToIcp` on anvil is minted
//! on the PocketIC ledger, and an admin action the canister signed for SNS governance runs
//! through `execute` on anvil. It needs `anvil`, `forge` and `cast` on PATH, so it only runs when
//! asked for:
//!
//! `cargo test -p integration_tests -- --ignored gldt_swap_suite::bridge::e2e_anvil`

use crate::client::gldt_swap::{
    bridge_sns_action, get_bridge_admin_action, get_bridge_status, get_bridge_transfer_in,
    get_bridge_transfer_out,
};
use crate::client::icrc1_icrc2_token::icrc1_balance_of;
use crate::gldt_swap_suite::bridge::outcalls::serve_outcalls;
use crate::gldt_swap_suite::bridge::setup::{
    anvil_chain_config, bridge_out, wait_for_signers, BridgeEnv, BridgeEnvBuilder,
};
use candid::{Nat, Principal};
use gldt_swap_common::bridge::{
    BridgeSnsAction, ChainStatus, EvmAdminAction, EvmAdminRequest, EvmChain, EvmVoucher,
    InboundStatus, OutboundStatus,
};
use icrc_ledger_types::icrc1::account::Account;
use pocket_ic::common::rest::{
    CanisterHttpHeader, CanisterHttpReply, CanisterHttpRequest, CanisterHttpResponse,
};
use serde_json::{json, Value};
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::time::Duration;

/// Anvil's public account 0, which deploys.
const DEPLOYER: &str = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
/// Anvil's public account 1, which claims the voucher and burns back to ICP.
const HOLDER: &str = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
/// 1 GLDT.
const ONE: u128 = 100_000_000;
/// The URLs `anvil_chain_config` names; every one of them is answered by anvil.
const ANVIL_URLS: [&str; 3] = [
    "https://head.anvil.test",
    "https://alchemy.anvil.test",
    "https://ankr.anvil.test",
];

/// A fresh anvil on a free port, stopped when dropped.
struct Anvil {
    child: Child,
    port: u16,
}

impl Anvil {
    fn start() -> Self {
        let port = TcpListener::bind("127.0.0.1:0")
            .unwrap()
            .local_addr()
            .unwrap()
            .port();
        let child = Command::new("anvil")
            .args(["--port", &port.to_string(), "--silent"])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .expect("anvil must be on PATH");
        let anvil = Anvil { child, port };
        for _ in 0..100 {
            if anvil.post(&json_rpc_body("eth_chainId", json!([]))).is_ok() {
                return anvil;
            }
            std::thread::sleep(Duration::from_millis(100));
        }
        panic!("anvil did not start on port {port}");
    }

    fn url(&self) -> String {
        format!("http://127.0.0.1:{}", self.port)
    }

    /// Posts a JSON-RPC body as it is, and returns anvil's reply body.
    fn post(&self, body: &[u8]) -> std::io::Result<Vec<u8>> {
        let mut stream = TcpStream::connect(("127.0.0.1", self.port))?;
        write!(
            stream,
            "POST / HTTP/1.1\r\nHost: 127.0.0.1:{}\r\nContent-Type: application/json\r\n\
             Content-Length: {}\r\nConnection: close\r\n\r\n",
            self.port,
            body.len()
        )?;
        stream.write_all(body)?;
        let mut reply = Vec::new();
        stream.read_to_end(&mut reply)?;
        let split = reply
            .windows(4)
            .position(|w| w == b"\r\n\r\n")
            .ok_or_else(|| std::io::Error::other("no HTTP header end"))?;
        let head = String::from_utf8_lossy(&reply[..split]).to_lowercase();
        let body = &reply[split + 4..];
        if head.contains("transfer-encoding: chunked") {
            Ok(dechunk(body))
        } else {
            Ok(body.to_vec())
        }
    }

    fn rpc(&self, method: &str, params: Value) -> Value {
        let reply: Value =
            serde_json::from_slice(&self.post(&json_rpc_body(method, params)).unwrap()).unwrap();
        assert!(reply.get("error").is_none(), "{method}: {reply}");
        reply["result"].clone()
    }

    fn mine(&self, blocks: u64) {
        self.rpc("anvil_mine", json!([format!("{blocks:#x}")]));
    }
}

impl Drop for Anvil {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

fn json_rpc_body(method: &str, params: Value) -> Vec<u8> {
    json!({ "jsonrpc": "2.0", "id": 1, "method": method, "params": params })
        .to_string()
        .into_bytes()
}

/// The body of a chunked HTTP reply.
fn dechunk(mut data: &[u8]) -> Vec<u8> {
    let mut out = Vec::new();
    loop {
        let line_end = data.windows(2).position(|w| w == b"\r\n").unwrap();
        let size_text = std::str::from_utf8(&data[..line_end]).unwrap();
        let size = usize::from_str_radix(size_text.split(';').next().unwrap().trim(), 16).unwrap();
        data = &data[line_end + 2..];
        if size == 0 {
            return out;
        }
        out.extend_from_slice(&data[..size]);
        data = &data[size + 2..];
    }
}

/// Answers a PocketIC outcall with anvil's answer to the same JSON-RPC body.
fn forward(anvil: &Anvil, request: &CanisterHttpRequest) -> CanisterHttpResponse {
    // the EVM RPC canister adds a slash after the host
    assert!(
        ANVIL_URLS.contains(&request.url.trim_end_matches('/')),
        "an outcall to {}",
        request.url
    );
    CanisterHttpResponse::CanisterHttpReply(CanisterHttpReply {
        status: 200,
        headers: vec![CanisterHttpHeader {
            name: "Content-Type".to_string(),
            value: "application/json".to_string(),
        }],
        body: anvil.post(&request.body).expect("anvil answers"),
    })
}

fn evm_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../evm/gldt-bridge")
}

/// Runs a command and returns its standard output; panics with both outputs if it fails.
fn run(command: &mut Command) -> String {
    let out = command
        .output()
        .unwrap_or_else(|e| panic!("{command:?}: {e}"));
    let stdout = String::from_utf8_lossy(&out.stdout).to_string();
    assert!(
        out.status.success(),
        "{command:?} failed:\n{stdout}\n{}",
        String::from_utf8_lossy(&out.stderr)
    );
    stdout
}

/// Runs `DeployLocal.s.sol` on anvil and returns `deployments/local.json`. Without `signers`
/// it is a dry run with anvil's accounts 1 and 2 as signers. A dry run on a fresh anvil
/// deploys to the addresses the broadcast will use.
fn deploy_local(anvil: &Anvil, signers: Option<(&str, &str)>) -> Value {
    let mut command = Command::new("forge");
    command.current_dir(evm_dir()).args([
        "script",
        "script/DeployLocal.s.sol",
        "--rpc-url",
        &anvil.url(),
        "--unlocked",
        "--sender",
        DEPLOYER,
    ]);
    command.env_remove("ADMIN_SIGNER").env_remove("ICP_SIGNER");
    command.env_remove("OPERATOR");
    if let Some((admin, claims)) = signers {
        // --slow: on a default anvil, the 50 transactions push the base fee above the fee forge
        // fixed, and without it the last ones stay pending
        command.args(["--broadcast", "--slow"]);
        command.env("ADMIN_SIGNER", admin).env("ICP_SIGNER", claims);
    }
    run(&mut command);
    let text = std::fs::read_to_string(evm_dir().join("deployments/local.json")).unwrap();
    serde_json::from_str(&text).unwrap()
}

/// `cast send` from an unlocked anvil account; returns the receipt after checking it succeeded.
fn cast_send(anvil: &Anvil, from: &str, to: &str, signature: &str, args: &[String]) -> Value {
    let out = run(Command::new("cast")
        .args([
            "send",
            "--rpc-url",
            &anvil.url(),
            "--unlocked",
            "--from",
            from,
            "--json",
            to,
            signature,
        ])
        .args(args));
    let receipt: Value = serde_json::from_str(out.trim()).unwrap();
    assert_eq!(receipt["status"], "0x1", "{signature} reverted: {receipt}");
    receipt
}

/// `cast call`; returns the first word of the decoded result.
fn cast_call(anvil: &Anvil, to: &str, signature: &str, args: &[String]) -> String {
    let out = run(Command::new("cast")
        .args(["call", "--rpc-url", &anvil.url(), to, signature])
        .args(args));
    out.split_whitespace()
        .next()
        .unwrap_or_default()
        .to_string()
}

/// The ICP principal as `burnToIcp` takes it: its length, its bytes, then zeros.
fn principal_word(p: &Principal) -> String {
    let mut word = vec![p.as_slice().len() as u8];
    word.extend_from_slice(p.as_slice());
    word.resize(32, 0);
    format!("0x{}", hex::encode(word))
}

fn chain(env: &BridgeEnv) -> ChainStatus {
    get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &())
        .chains
        .into_iter()
        .next()
        .unwrap()
}

fn icp_balance(env: &BridgeEnv) -> u128 {
    let e8s = icrc1_balance_of(
        &env.pic,
        Principal::anonymous(),
        env.gldt_ledger_canister_id,
        &Account::from(env.user),
    );
    u128::try_from(e8s.0).unwrap()
}

/// Ticks until the transfer is `Signed`, without moving the clock, so no scrape tick starts.
fn wait_for_voucher(env: &BridgeEnv, id: u64) -> EvmVoucher {
    for _ in 0..50 {
        let status = get_bridge_transfer_out(&env.pic, env.user, env.gldt_swap_canister_id, &id)
            .expect("the transfer is stored")
            .status;
        if let OutboundStatus::Signed(voucher) = status {
            return voucher;
        }
        env.pic.tick();
    }
    panic!("outbound {id} was not signed");
}

#[test]
#[ignore = "needs anvil, forge and cast on PATH"]
fn anvil_burn_is_minted_and_voucher_claims_on_anvil() {
    let anvil = Anvil::start();

    // 1. Where DeployLocal puts its first token, from a dry run on the fresh chain
    let planned = deploy_local(&anvil, None);
    let token = planned["tokenA"]["token"].as_str().unwrap().to_string();

    // 2. gldt_swap with one chain, Ethereum on anvil's chain id with that token. Its first
    //    tick starts as soon as the keys are loaded, and waits for its head outcall. Its clock
    //    starts now, like anvil's, so the deadlines it signs are in anvil's future.
    let env = BridgeEnvBuilder::new()
        .with_chains(vec![anvil_chain_config(EvmChain::Ethereum, &token)])
        .starting_now()
        .build();
    let (claims, admin) = wait_for_signers(&env);

    // 3. The real deploy, with the canister's two addresses as the token's signers
    let deployed = deploy_local(&anvil, Some((&admin, &claims)));
    assert_eq!(deployed["tokenA"]["token"].as_str(), Some(token.as_str()));
    assert_eq!(
        cast_call(&anvil, &token, "adminSigner()(address)", &[]).to_lowercase(),
        admin.to_lowercase()
    );
    assert_eq!(
        cast_call(&anvil, &token, "icpSigner()(address)", &[]).to_lowercase(),
        claims.to_lowercase()
    );
    anvil.mine(5);

    // 4. The first tick reads anvil: no burn, no supply, the token as its own owner and the
    //    canister's signers. The chain opens.
    serve_outcalls(&env.pic, |r| forward(&anvil, r));
    let opened = chain(&env);
    assert!(opened.start_block.is_some(), "{opened:?}");
    assert_eq!(opened.stopped, None);
    assert_eq!(opened.chain_id, 31337);

    // 5. ICP to anvil: bridge_to_evm burns 10 GLDT on ICP, and the voucher claims on anvil
    let transfer = bridge_out(
        &env.pic,
        env.gldt_ledger_canister_id,
        env.gldt_swap_canister_id,
        env.user,
        EvmChain::Ethereum,
        (10 * ONE) as u64,
    );
    let voucher = wait_for_voucher(&env, transfer.id);
    assert_eq!(voucher.chain_id, 31337);
    assert_eq!(voucher.token.to_lowercase(), token.to_lowercase());
    assert_eq!(voucher.recipient, HOLDER);
    cast_send(
        &anvil,
        HOLDER,
        &token,
        "claimFromIcp(uint64,address,uint256,bytes)",
        &[
            voucher.icp_burn_index.to_string(),
            voucher.recipient.clone(),
            voucher.amount.0.to_string(),
            voucher.signature.clone(),
        ],
    );
    assert_eq!(
        cast_call(
            &anvil,
            &token,
            "balanceOf(address)(uint256)",
            &[HOLDER.to_string()]
        ),
        (10 * ONE).to_string()
    );
    assert_eq!(
        cast_call(
            &anvil,
            &token,
            "isClaimed(uint64)(bool)",
            &[voucher.icp_burn_index.to_string()]
        ),
        "true"
    );

    // 6. anvil to ICP: the holder burns 4 GLDT to the user's ICP account
    let receipt = cast_send(
        &anvil,
        HOLDER,
        &token,
        "burnToIcp(uint256,bytes32,bytes32)",
        &[
            (4 * ONE).to_string(),
            principal_word(&env.user),
            format!("0x{}", "00".repeat(32)),
        ],
    );
    let tx_hash = receipt["transactionHash"].as_str().unwrap().to_string();
    // past the chain's 2 confirmations
    anvil.mine(3);
    let balance_before = icp_balance(&env);

    // 7. A scrape tick finds the burn, and the processor mints it on ICP
    let mut found = None;
    for _ in 0..5 {
        env.pic.advance_time(Duration::from_secs(180));
        serve_outcalls(&env.pic, |r| forward(&anvil, r));
        found = get_bridge_transfer_in(
            &env.pic,
            env.user,
            env.gldt_swap_canister_id,
            &(EvmChain::Ethereum, 0),
        );
        if found.is_some() {
            break;
        }
    }
    let found = found.unwrap_or_else(|| panic!("the burn was not found: {:?}", chain(&env)));
    assert_eq!(found.tx_hash.to_lowercase(), tx_hash.to_lowercase());
    assert_eq!(found.amount, Nat::from(4 * ONE));
    assert_eq!(found.to, Account::from(env.user));
    assert_eq!(found.evm_from.to_lowercase(), HOLDER.to_lowercase());

    for _ in 0..5 {
        if matches!(
            get_bridge_transfer_in(
                &env.pic,
                env.user,
                env.gldt_swap_canister_id,
                &(EvmChain::Ethereum, 0)
            )
            .unwrap()
            .status,
            InboundStatus::Minted { .. }
        ) {
            break;
        }
        env.pic.advance_time(Duration::from_secs(61));
        env.tick_n(10);
    }
    let minted = get_bridge_transfer_in(
        &env.pic,
        env.user,
        env.gldt_swap_canister_id,
        &(EvmChain::Ethereum, 0),
    )
    .unwrap();
    assert!(
        matches!(minted.status, InboundStatus::Minted { .. }),
        "{:?}",
        minted.status
    );
    assert_eq!(icp_balance(&env), balance_before + 4 * ONE);

    let status = get_bridge_status(&env.pic, env.controller, env.gldt_swap_canister_id, &());
    assert_eq!(status.bridged_out, Nat::from(6 * ONE));
    assert_eq!(status.out_pending, Nat::from(0u8));
    let after = chain(&env);
    assert_eq!(after.next_burn_id, 1);
    assert_eq!(
        after.supply.map(|s| s.total_supply),
        Some(Nat::from(6 * ONE))
    );

    // 8. SNS governance has the canister sign SetMinBurnToIcp(2 GLDT), and anyone runs it on
    //    anvil through execute
    bridge_sns_action(
        &env.pic,
        env.sns_governance,
        env.gldt_swap_canister_id,
        &BridgeSnsAction::SignEvmAdmin(vec![EvmAdminRequest {
            chain: EvmChain::Ethereum,
            actions: vec![EvmAdminAction::SetMinBurnToIcp {
                amount: Nat::from(2 * ONE),
            }],
            valid_for_secs: None,
        }]),
    )
    .unwrap_or_else(|e| panic!("bridge_sns_action failed: {e}"));
    let action = get_bridge_admin_action(&env.pic, env.user, env.gldt_swap_canister_id, &0)
        .expect("admin action 0 is stored");
    assert_eq!(action.chain_id, 31337);
    assert_eq!(action.token.to_lowercase(), token.to_lowercase());
    let latest = anvil.rpc("eth_getBlockByNumber", json!(["latest", false]));
    let anvil_time = u64::from_str_radix(
        latest["timestamp"]
            .as_str()
            .unwrap()
            .trim_start_matches("0x"),
        16,
    )
    .unwrap();
    assert!(
        action.deadline > anvil_time,
        "deadline {} is not after anvil's time {anvil_time}",
        action.deadline
    );
    assert_eq!(
        cast_call(&anvil, &token, "minBurnToIcp()(uint256)", &[]),
        ONE.to_string()
    );
    let calls: Vec<String> = action
        .calls
        .iter()
        .map(|call| format!("({},0x{})", call.target, hex::encode(&call.data)))
        .collect();
    cast_send(
        &anvil,
        DEPLOYER,
        &token,
        "execute((address,bytes)[],uint256,uint256,bytes)",
        &[
            format!("[{}]", calls.join(",")),
            action.nonce.to_string(),
            action.deadline.to_string(),
            action.signature.clone(),
        ],
    );
    assert_eq!(
        cast_call(&anvil, &token, "minBurnToIcp()(uint256)", &[]),
        (2 * ONE).to_string()
    );
    assert_eq!(
        cast_call(
            &anvil,
            &token,
            "usedNonce(uint256)(bool)",
            &[action.nonce.to_string()]
        ),
        "true"
    );
}
