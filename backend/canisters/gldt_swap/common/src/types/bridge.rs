//! Candid types of the GLDT bridge between ICP, Ethereum and Base.
//!
//! Shared by the api and impl crates. Every EVM `uint256` is a `nat` here; the
//! canister keeps it as a 256-bit integer internally and converts losslessly.
//! EVM addresses and hashes are `0x` hex text.

use candid::{CandidType, Nat, Principal};
use ic_stable_structures::{storable::Bound, Storable};
use icrc_ledger_types::icrc1::account::{Account, Subaccount};
use icrc_ledger_types::icrc2::transfer_from::TransferFromError;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;

#[derive(
    CandidType, Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash,
)]
pub enum EvmChain {
    Ethereum,
    Base,
}

// Config, set only by init and upgrade arguments

/// A built-in provider of the EVM RPC canister. The canister maps it to the
/// EVM RPC canister's own provider types; Base has no Cloudflare.
#[derive(
    CandidType, Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash,
)]
pub enum EvmProvider {
    Alchemy,
    Ankr,
    BlockPi,
    PublicNode,
    Llama,
    Cloudflare,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct ChainConfig {
    pub chain: EvmChain,
    /// 1 for Ethereum, 8453 for Base (other ids on test networks).
    pub chain_id: u64,
    /// LayerZero endpoint id: 30101 for Ethereum, 30184 for Base.
    pub lz_eid: u32,
    /// The token proxy address, the same on both chains.
    pub token: String,
    /// The LayerZero EndpointV2 address.
    pub lz_endpoint: String,
    pub confirmations: u64,
    /// Public HTTPS endpoint for `eth_blockNumber`, without an API key.
    pub head_rpc_url: String,
    /// Exactly two distinct built-in EVM RPC providers.
    pub providers: Vec<EvmProvider>,
    pub scrape_interval_secs: u64,
    /// At most 500.
    pub max_window_blocks: u64,
    /// 1 to 50.
    pub log_batch_size: u32,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct BridgeConfig {
    /// ORIGYN SNS governance, the only caller of `bridge_sns_action`.
    pub sns_governance: Principal,
    pub evm_rpc_canister: Principal,
    /// `key_1` in production, `test_key_1` on staging.
    pub ecdsa_key_name: String,
    pub admin_action_validity_secs: u64,
    pub admin_action_max_validity_secs: u64,
    pub chains: Vec<ChainConfig>,
}

/// Restarts a stopped chain from the given cursor.
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct ChainReset {
    pub chain: EvmChain,
    pub last_scraped_block: u64,
    pub next_burn_id: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct BridgeUpgrade {
    /// Replaces the whole config when present.
    pub config: Option<BridgeConfig>,
    pub chain_resets: Vec<ChainReset>,
}

// Users

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct BridgeToEvmArgs {
    pub chain: EvmChain,
    pub recipient: String,
    pub amount: Nat,
    pub from_subaccount: Option<Subaccount>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct EvmVoucher {
    pub chain_id: u64,
    pub token: String,
    pub icp_burn_index: u64,
    pub recipient: String,
    pub amount: Nat,
    /// `0x` and 65 bytes of hex.
    pub signature: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum OutboundStatus {
    Burning,
    /// The ledger outcome is unknown; retried with the same arguments.
    BurnUnknown,
    Burned {
        icp_burn_index: u64,
    },
    Signed(EvmVoucher),
    Failed(String),
    /// The ledger said TooOld while the outcome was unknown.
    NeedsManualCheck(String),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct OutboundTransfer {
    pub id: u64,
    pub from: Account,
    pub chain: EvmChain,
    pub recipient: String,
    pub amount: Nat,
    pub created_at: u64,
    pub status: OutboundStatus,
}

/// Stored in the canister's outbound stable map, MessagePack encoded with named fields.
impl Storable for OutboundTransfer {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        let mut buf = Vec::new();
        bity_ic_serializer::serialize(self, &mut buf).expect("failed to encode OutboundTransfer");
        Cow::Owned(buf)
    }

    fn into_bytes(self) -> Vec<u8> {
        self.to_bytes().into_owned()
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        bity_ic_serializer::deserialize(bytes.as_ref()).expect("failed to decode OutboundTransfer")
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum InboundStatus {
    Queued,
    /// The ledger outcome is unknown; retried with the same arguments.
    MintUnknown,
    Minted {
        icp_block_index: u64,
    },
    /// The ledger refused the mint, for example because the destination is the minting account.
    Quarantined(String),
    /// The ledger said TooOld while the outcome was unknown.
    NeedsManualCheck(String),
    /// Set by an SNS resolve action.
    Rejected(String),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct InboundTransfer {
    pub chain: EvmChain,
    pub token: String,
    pub burn_id: u64,
    pub tx_hash: String,
    pub log_index: u64,
    pub block_number: u64,
    pub evm_from: String,
    pub to: Account,
    pub amount: Nat,
    pub discovered_at: u64,
    pub status: InboundStatus,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum BridgeError {
    Paused,
    UnknownChain,
    InvalidRecipient,
    ZeroAmount,
    Busy,
    /// Keys not loaded, a chain has no start block, or this chain is stopped.
    NotReady(String),
    /// The ledger refused the burn; nothing changed.
    Burn(TransferFromError),
}

// SNS actions

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum EvmAdminAction {
    SetPaused {
        lz_paused: bool,
        icp_bridge_paused: bool,
    },
    SetLzReceiveGas {
        dst_eid: u32,
        gas: Nat,
    },
    SetOperator {
        operator: Option<String>,
    },
    SetIcpSigner {
        signer: String,
    },
    SetAdminSigner {
        signer: String,
    },
    SetMinBurnToIcp {
        amount: Nat,
    },
    SetPeer {
        eid: u32,
        peer: String,
    },
    SetSendLibrary {
        eid: u32,
        lib: String,
    },
    SetReceiveLibrary {
        eid: u32,
        lib: String,
        grace_period: Nat,
    },
    SetUlnConfig {
        lib: String,
        eid: u32,
        confirmations: u64,
        required_dvns: Vec<String>,
        optional_dvns: Vec<String>,
        optional_threshold: u8,
    },
    SetExecutorConfig {
        lib: String,
        eid: u32,
        max_message_size: u32,
        executor: String,
    },
    BurnLzMessage {
        src_eid: u32,
        sender: String,
        nonce: u64,
        payload_hash: String,
    },
    Upgrade {
        implementation: String,
        code_hash: String,
    },
    CancelNonce {
        nonce: u64,
    },
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct EvmAdminRequest {
    pub chain: EvmChain,
    /// One signed batch, run in order.
    pub actions: Vec<EvmAdminAction>,
    /// Defaults to 7 days, at most 30.
    pub valid_for_secs: Option<u64>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum ResolveAction {
    InboundMarkMinted {
        chain: EvmChain,
        burn_id: u64,
        icp_block_index: u64,
    },
    InboundRetry {
        chain: EvmChain,
        burn_id: u64,
    },
    InboundMintTo {
        chain: EvmChain,
        burn_id: u64,
        to: Account,
    },
    InboundReject {
        chain: EvmChain,
        burn_id: u64,
        reason: String,
    },
    OutboundMarkBurned {
        id: u64,
        icp_burn_index: u64,
    },
    OutboundMarkFailed {
        id: u64,
    },
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum BridgeSnsAction {
    SignEvmAdmin(Vec<EvmAdminRequest>),
    SetIcpPaused {
        inbound: Option<bool>,
        outbound: Option<bool>,
    },
    Resolve(Vec<ResolveAction>),
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct EvmCall {
    pub target: String,
    pub data: Vec<u8>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct SignedEvmAdminAction {
    pub id: u64,
    pub chain: EvmChain,
    pub chain_id: u64,
    pub token: String,
    pub calls: Vec<EvmCall>,
    pub nonce: u64,
    /// Unix seconds.
    pub deadline: u64,
    /// `0x` and 65 bytes of hex.
    pub signature: String,
    pub description: String,
    pub created_at: u64,
}

// Status and small endpoints

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct GetBridgeEvmSignersResponse {
    /// EIP-55 address of the claims key (`icpSigner`), once loaded.
    pub claims: Option<String>,
    /// EIP-55 address of the admin key (`adminSigner`), once loaded.
    pub admin: Option<String>,
}

/// Authorized principals can only pause: a `true` sets the flag, a `false` leaves it as it is.
#[derive(CandidType, Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub struct BridgePauseArgs {
    pub inbound: bool,
    pub outbound: bool,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum Severity {
    Info,
    Warning,
    Critical,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Alert {
    /// Nanoseconds since the Unix epoch.
    pub time: u64,
    pub severity: Severity,
    pub message: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct WindowStatus {
    pub to_block: u64,
    pub end_burn_id: u64,
    pub total_supply: Nat,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct SupplyReadingStatus {
    pub block: u64,
    pub total_supply: Nat,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct ChainStatus {
    pub chain: EvmChain,
    pub chain_id: u64,
    pub token: String,
    pub start_block: Option<u64>,
    pub last_scraped_block: u64,
    pub next_burn_id: u64,
    pub window: Option<WindowStatus>,
    pub supply: Option<SupplyReadingStatus>,
    pub failed_ticks: u32,
    pub last_ok_at: Option<u64>,
    pub last_error: Option<String>,
    pub stopped: Option<String>,
}

/// Both sides of the supply guard: minting holds while `evm_side > icp_side`.
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct SupplyGuardStatus {
    pub holding: bool,
    /// The sum of the chains' supply readings plus every unminted inbound burn.
    pub evm_side: Nat,
    /// `bridged_out`.
    pub icp_side: Nat,
}

/// Inbound transfers not yet settled, by status: the mint queue (`queued`, `mint_unknown`) and
/// those held for an SNS resolve (`quarantined`, `needs_manual_check`).
#[derive(CandidType, Serialize, Deserialize, Clone, Debug, Default, PartialEq, Eq)]
pub struct QueueSizes {
    pub queued: u64,
    pub mint_unknown: u64,
    pub quarantined: u64,
    pub needs_manual_check: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct BridgeStatus {
    pub configured: bool,
    pub bridged_out: Nat,
    pub out_pending: Nat,
    pub paused_in: bool,
    pub paused_out: bool,
    pub chains: Vec<ChainStatus>,
    pub supply_guard: SupplyGuardStatus,
    pub queue: QueueSizes,
    pub claims_signer: Option<String>,
    pub admin_signer: Option<String>,
    pub alerts: Vec<Alert>,
    pub alerts_total: u64,
}
