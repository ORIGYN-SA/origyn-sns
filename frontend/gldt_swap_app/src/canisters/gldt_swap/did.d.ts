import type { Principal } from '@icp-sdk/core/principal';
import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';

/**
 * [Account](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-3/README.md#value)
 * representation of ledgers supporting the ICRC-1 standard.
 */
export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export interface Alert {
  /**
   * Nanoseconds since the Unix epoch.
   */
  'time' : bigint,
  'message' : string,
  'severity' : Severity,
}
/**
 * Information about where to find archived blocks. Returned as part of [`GetBlocksResult`].
 */
export interface ArchivedBlocks {
  'args' : Array<GetBlocksRequest>,
  'callback' : [Principal, string],
}
export interface Args {
  'principal' : [] | [Principal],
  'canister_id' : Principal,
}
export type Args_1 = { 'Upgrade' : UpgradeArgs } |
  { 'Init' : InitArgs };
/**
 * A block with an ID. Returned as part of [`GetBlocksResult`].
 */
export interface BlockWithId { 'id' : bigint, 'block' : ICRC3Value }
export interface BridgeConfig {
  /**
   * `key_1` in production, `test_key_1` on staging.
   */
  'ecdsa_key_name' : string,
  'admin_action_max_validity_secs' : bigint,
  /**
   * ORIGYN SNS governance, the only caller of `bridge_sns_action`.
   */
  'sns_governance' : Principal,
  'chains' : Array<ChainConfig>,
  'admin_action_validity_secs' : bigint,
  'evm_rpc_canister' : Principal,
}
export type BridgeError = { 'Paused' : null } |
  {
    /**
     * The ledger refused the burn; nothing changed.
     */
    'Burn' : TransferFromError
  } |
  { 'Busy' : null } |
  { 'UnknownChain' : null } |
  {
    /**
     * Keys not loaded, a chain has no start block, or this chain is stopped.
     */
    'NotReady' : string
  } |
  { 'ZeroAmount' : null } |
  { 'InvalidRecipient' : null };
/**
 * Authorized principals can only pause: a `true` sets the flag, a `false` leaves it as it is.
 */
export interface BridgePauseArgs { 'inbound' : boolean, 'outbound' : boolean }
export type BridgeSnsAction = { 'SignEvmAdmin' : Array<EvmAdminRequest> } |
  { 'Resolve' : Array<ResolveAction> } |
  {
    'SetIcpPaused' : { 'inbound' : [] | [boolean], 'outbound' : [] | [boolean] }
  };
export interface BridgeStatus {
  'claims_signer' : [] | [string],
  'paused_out' : boolean,
  'supply_guard' : SupplyGuardStatus,
  'alerts' : Array<Alert>,
  'admin_signer' : [] | [string],
  'paused_in' : boolean,
  'queue' : QueueSizes,
  /**
   * The canister's cycle balance.
   */
  'cycles' : bigint,
  'configured' : boolean,
  'chains' : Array<ChainStatus>,
  'alerts_total' : bigint,
  'out_pending' : bigint,
  'bridged_out' : bigint,
  'outbound' : OutboundCounts,
}
export interface BridgeToEvmArgs {
  'chain' : EvmChain,
  'recipient' : string,
  'from_subaccount' : [] | [Uint8Array | number[]],
  'amount' : bigint,
}
export interface BridgeUpgrade {
  'chain_resets' : Array<ChainReset>,
  /**
   * Replaces the whole config when present.
   */
  'config' : [] | [BridgeConfig],
  /**
   * Chains whose next scrape moves the cursor straight to the confirmed head, once, if the
   * token shows no burn since the cursor. With a burn in between, the chain scrapes on as
   * usual and keeps every burn.
   */
  'skip_to_head' : [] | [Array<EvmChain>],
}
/**
 * Represents a semantic version number following the MAJOR.MINOR.PATCH format.
 * 
 * # Examples
 * 
 * ```
 * use types::BuildVersion;
 * 
 * let version = BuildVersion::new(1, 2, 3);
 * assert_eq!(version.to_string(), "1.2.3");
 * 
 * let parsed = "1.2.3".parse::<BuildVersion>().unwrap();
 * assert_eq!(version, parsed);
 * ```
 */
export interface BuildVersion {
  /**
   * Major version number, incremented for incompatible API changes
   */
  'major' : number,
  /**
   * Minor version number, incremented for backwards-compatible functionality additions
   */
  'minor' : number,
  /**
   * Patch version number, incremented for backwards-compatible bug fixes
   */
  'patch' : number,
}
export interface ChainConfig {
  'confirmations' : bigint,
  /**
   * The token proxy address, the same on both chains.
   */
  'token' : string,
  'chain' : EvmChain,
  'scrape_interval_secs' : bigint,
  /**
   * At most 500.
   */
  'max_window_blocks' : bigint,
  /**
   * The LayerZero EndpointV2 address.
   */
  'lz_endpoint' : string,
  /**
   * 1 (or Sepolia 11155111) for Ethereum, 8453 (or Base Sepolia 84532) for Base.
   */
  'chain_id' : bigint,
  /**
   * Public HTTPS endpoint for `eth_blockNumber`, without an API key.
   */
  'head_rpc_url' : string,
  /**
   * LayerZero endpoint id: 30101 for Ethereum, 30184 for Base.
   */
  'lz_eid' : number,
  /**
   * Exactly two distinct providers: both built-in for the chain id, or both `Custom`.
   */
  'providers' : Array<EvmProvider>,
  /**
   * 1 to 50.
   */
  'log_batch_size' : number,
}
/**
 * Restarts a stopped chain from the given cursor.
 */
export interface ChainReset {
  'chain' : EvmChain,
  'last_scraped_block' : bigint,
  'next_burn_id' : bigint,
}
export interface ChainStatus {
  'last_error' : [] | [string],
  'token' : string,
  'stopped' : [] | [string],
  'chain' : EvmChain,
  'window' : [] | [WindowStatus],
  'last_scraped_block' : bigint,
  'chain_id' : bigint,
  'supply' : [] | [SupplyReadingStatus],
  'next_burn_id' : bigint,
  'failed_ticks' : number,
  'last_ok_at' : [] | [bigint],
  'start_block' : [] | [bigint],
}
export interface ConsentInfo {
  'metadata' : ConsentMessageMetadata,
  'consent_message' : ConsentMessage,
}
export type ConsentMessage = { 'FieldsDisplayMessage' : FieldsDisplay } |
  { 'GenericDisplayMessage' : string };
export interface ConsentMessageMetadata {
  'utc_offset_minutes' : [] | [number],
  'language' : string,
}
export interface ConsentMessageRequest {
  'arg' : Uint8Array | number[],
  'method' : string,
  'user_preferences' : ConsentMessageSpec,
}
export interface ConsentMessageSpec {
  'metadata' : ConsentMessageMetadata,
  'device_spec' : [] | [DisplayMessageType],
}
export interface CustomFractionalizationConfig {
  'per_token_config' : Array<[bigint, GeneralFractionalizationConfig]>,
}
export type DisplayMessageType = { 'GenericDisplay' : null } |
  { 'FieldsDisplay' : null };
export interface Duration { 'secs' : bigint, 'nanos' : number }
export interface ErrorInfo { 'description' : string }
export type EvmAdminAction = {
    'SetSendLibrary' : { 'eid' : number, 'lib' : string }
  } |
  { 'CancelNonce' : { 'nonce' : bigint } } |
  { 'SetLzReceiveGas' : { 'gas' : bigint, 'dst_eid' : number } } |
  { 'Upgrade' : { 'implementation' : string, 'code_hash' : string } } |
  {
    'SetExecutorConfig' : {
      'eid' : number,
      'lib' : string,
      'max_message_size' : number,
      'executor' : string,
    }
  } |
  {
    'SetUlnConfig' : {
      'eid' : number,
      'lib' : string,
      'confirmations' : bigint,
      'required_dvns' : Array<string>,
      'optional_dvns' : Array<string>,
      'optional_threshold' : number,
    }
  } |
  { 'SetAdminSigner' : { 'signer' : string } } |
  {
    'BurnLzMessage' : {
      'sender' : string,
      'src_eid' : number,
      'nonce' : bigint,
      'payload_hash' : string,
    }
  } |
  { 'SetOperator' : { 'operator' : [] | [string] } } |
  {
    'SetReceiveLibrary' : {
      'eid' : number,
      'lib' : string,
      'grace_period' : bigint,
    }
  } |
  { 'SetMinBurnToIcp' : { 'amount' : bigint } } |
  { 'SetIcpSigner' : { 'signer' : string } } |
  { 'SetPeer' : { 'eid' : number, 'peer' : string } } |
  { 'SetPaused' : { 'lz_paused' : boolean, 'icp_bridge_paused' : boolean } };
export interface EvmAdminRequest {
  'chain' : EvmChain,
  /**
   * One signed batch, run in order.
   */
  'actions' : Array<EvmAdminAction>,
  /**
   * Defaults to 7 days, at most 30.
   */
  'valid_for_secs' : [] | [bigint],
}
export interface EvmCall { 'data' : Uint8Array | number[], 'target' : string }
export type EvmChain = { 'Base' : null } |
  { 'Ethereum' : null };
/**
 * A provider of the EVM RPC canister. A built-in one maps to the EVM RPC canister's providers
 * for the chain id: Sepolia (11155111) has no Llama or Cloudflare, Base (8453) has no
 * Cloudflare, and Base Sepolia (84532) has no built-in provider at all. `Custom` is an HTTPS
 * JSON-RPC URL sent with no headers, so no API key ever sits in canister state.
 */
export type EvmProvider = { 'Alchemy' : null } |
  { 'Llama' : null } |
  { 'BlockPi' : null } |
  { 'Cloudflare' : null } |
  { 'PublicNode' : null } |
  { 'Ankr' : null } |
  { 'Custom' : { 'url' : string } };
export interface EvmVoucher {
  'token' : string,
  /**
   * `0x` and 65 bytes of hex.
   */
  'signature' : string,
  'recipient' : string,
  /**
   * The block index of the burn on the GLDT ledger. An index at or above 2^63 marks a
   * voucher backed by an NFT swap (`swap_nft_for_evm`), not an ICP burn: 2^63 plus the
   * outbound id.
   */
  'icp_burn_index' : bigint,
  'chain_id' : bigint,
  'amount' : bigint,
}
export interface FieldsDisplay {
  'fields' : Array<[string, Value]>,
  'intent' : string,
}
export type FractionalizationConfig = {
    'Custom' : CustomFractionalizationConfig
  } |
  { 'General' : GeneralFractionalizationConfig };
export type GeneralError = { 'InvalidConfig' : string } |
  { 'InvalidNftCanister' : string } |
  { 'TransactionAddError' : string } |
  { 'TransferError' : string } |
  { 'UserIsNotNftOwner' : string } |
  { 'AlreadyProcessing' : string } |
  { 'TransactionPreparationError' : string } |
  { 'InvalidPrincipal' : string } |
  { 'NotAuthorized' : string } |
  { 'EmptyArgs' : string } |
  { 'CallError' : string } |
  { 'CanisterIsNotNftOwner' : string } |
  { 'ConfigNotFound' : string } |
  { 'InvalidPercentage' : string };
export interface GeneralFractionalizationConfig {
  'division' : bigint,
  'ledger_id' : Principal,
  'swap_fee' : bigint,
}
/**
 * The arguments for the
 * [ICRC-3 `icrc3_get_blocks`](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-3/README.md#icrc3_get_blocks)
 * endpoint.
 */
export interface GetBlocksRequest { 'start' : bigint, 'length' : bigint }
/**
 * The result type for the
 * [ICRC-3 `icrc3_get_blocks`](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-3/README.md#icrc3_get_blocks)
 * endpoint.
 */
export interface GetBlocksResult {
  'log_length' : bigint,
  'blocks' : Array<BlockWithId>,
  'archived_blocks' : Vec,
}
/**
 * The result type for the
 * [ICRC-3 `icrc3_get_blocks`](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-3/README.md#icrc3_get_blocks)
 * endpoint.
 */
export interface GetBlocksResult_1 {
  'log_length' : bigint,
  'blocks' : Array<BlockWithId>,
  'archived_blocks' : Array<ArchivedBlocks>,
}
export interface GetBridgeEvmSignersResponse {
  /**
   * EIP-55 address of the claims key (`icpSigner`), once loaded.
   */
  'claims' : [] | [string],
  /**
   * EIP-55 address of the admin key (`adminSigner`), once loaded.
   */
  'admin' : [] | [string],
}
/**
 * The information returned as part of the return value for the
 * [`icrc3_get_archives`](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-3/README.md)
 * endpoint.
 */
export interface ICRC3ArchiveInfo {
  'end' : bigint,
  'canister_id' : Principal,
  'start' : bigint,
}
/**
 * Configuration for the ICRC3 implementation.
 * 
 * This struct contains all the necessary configuration parameters for the ICRC3 implementation,
 * including supported block types and system constants.
 * 
 * # Examples
 * 
 * ```rust
 * use icrc3_library::config::{ICRC3Config, ICRC3Properties};
 * use std::time::Duration;
 * 
 * let config = ICRC3Config {
 * supported_blocks: vec![],
 * constants: ICRC3Properties::default(),
 * };
 * ```
 */
export interface ICRC3Config {
  /**
   * System constants and limits
   */
  'constants' : ICRC3Properties,
  /**
   * List of supported block types and their URLs
   */
  'supported_blocks' : Array<SupportedBlockType>,
}
/**
 * The data certificate returned from the
 * [ICRC-3 `icrc3_get_tip_certificate`](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-3/README.md#icrc3_get_tip_certificate)
 * endpoint.
 */
export interface ICRC3DataCertificate {
  'certificate' : Uint8Array | number[],
  'hash_tree' : Uint8Array | number[],
}
/**
 * System constants and limits for the ICRC3 implementation.
 * 
 * This struct defines various system parameters that control the behavior
 * of the ICRC3 implementation, such as transaction windows, memory limits,
 * and cycle management.
 */
export interface ICRC3Properties {
  /**
   * Maximum number of blocks per response
   */
  'max_blocks_per_response' : bigint,
  /**
   * Initial number of cycles
   */
  'initial_cycles' : bigint,
  /**
   * Time window for transaction validation
   */
  'tx_window' : Duration,
  /**
   * Maximum number of transactions to purge at once
   */
  'max_transactions_to_purge' : bigint,
  /**
   * Maximum memory size in bytes
   */
  'max_memory_size_bytes' : bigint,
  /**
   * ttl for non-archived transactions
   */
  'ttl_for_non_archived_transactions' : Duration,
  /**
   * Maximum number of transactions allowed in the window
   */
  'max_transactions_in_window' : bigint,
  /**
   * Maximum number of unarchived transactions
   */
  'max_unarchived_transactions' : bigint,
  /**
   * Number of cycles to reserve
   */
  'reserved_cycles' : bigint,
}
/**
 * A value defined in [the ICRC-3 standard](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-3/README.md#value).
 */
export type ICRC3Value = { 'Int' : bigint } |
  { 'Map' : Array<[string, ICRC3Value]> } |
  { 'Nat' : bigint } |
  { 'Blob' : Uint8Array | number[] } |
  { 'Text' : string } |
  { 'Array' : Array<ICRC3Value> };
export type Icrc21Error = {
    'GenericError' : { 'description' : string, 'error_code' : bigint }
  } |
  { 'InsufficientPayment' : ErrorInfo } |
  { 'UnsupportedCanisterCall' : ErrorInfo } |
  { 'ConsentMessageUnavailable' : ErrorInfo };
export interface Icrc28TrustedOriginsResponse {
  'trusted_origins' : Array<string>,
}
export type InboundStatus = { 'Queued' : null } |
  {
    /**
     * The ledger said TooOld while the outcome was unknown.
     */
    'NeedsManualCheck' : string
  } |
  {
    /**
     * Set by an SNS resolve action.
     */
    'Rejected' : string
  } |
  { 'Minted' : { 'icp_block_index' : bigint } } |
  {
    /**
     * The ledger refused the mint, for example because the destination is the minting account.
     */
    'Quarantined' : string
  } |
  {
    /**
     * The ledger outcome is unknown; retried with the same arguments.
     */
    'MintUnknown' : null
  };
export interface InboundTransfer {
  'to' : Account,
  'status' : InboundStatus,
  'token' : string,
  'log_index' : bigint,
  'chain' : EvmChain,
  'evm_from' : string,
  'block_number' : bigint,
  'burn_id' : bigint,
  'discovered_at' : bigint,
  'tx_hash' : string,
  'amount' : bigint,
}
export interface InitArgs {
  'buyback_burn_canister' : [] | [Account],
  /**
   * Bridge config and chain resets. `None` leaves the bridge unconfigured.
   */
  'bridge' : [] | [BridgeUpgrade],
  'test_mode' : boolean,
  'authorized_principals' : Array<Principal>,
  'version' : BuildVersion,
  'icrc3_config' : ICRC3Config,
  'gldt_swap_old_archive' : Principal,
  'commit_hash' : string,
  'swap_configs' : Array<SwapCanisterConfig>,
}
export interface Nft { 'id' : bigint, 'canister_id' : Principal }
/**
 * Outbound transfers not yet settled, by status: the processor's work (`burning`,
 * `burn_unknown`, `burned`) and those held for an SNS resolve (`needs_manual_check`).
 */
export interface OutboundCounts {
  'needs_manual_check' : bigint,
  'burn_unknown' : bigint,
  'burning' : bigint,
  'burned' : bigint,
}
export type OutboundStatus = {
    /**
     * Ready to sign. An `icp_burn_index` at or above 2^63 marks a transfer backed by an NFT
     * swap, not an ICP burn: 2^63 plus the outbound id.
     */
    'Burned' : { 'icp_burn_index' : bigint }
  } |
  { 'Failed' : string } |
  {
    /**
     * The ledger said TooOld while the outcome was unknown.
     */
    'NeedsManualCheck' : string
  } |
  {
    /**
     * The ledger outcome is unknown; retried with the same arguments.
     */
    'BurnUnknown' : null
  } |
  { 'Burning' : null } |
  { 'Signed' : EvmVoucher };
export interface OutboundTransfer {
  'id' : bigint,
  'status' : OutboundStatus,
  'from' : Account,
  'chain' : EvmChain,
  'recipient' : string,
  'created_at' : bigint,
  'amount' : bigint,
}
/**
 * Inbound transfers not yet settled, by status: the mint queue (`queued`, `mint_unknown`) and
 * those held for an SNS resolve (`quarantined`, `needs_manual_check`).
 */
export interface QueueSizes {
  'needs_manual_check' : bigint,
  'mint_unknown' : bigint,
  'queued' : bigint,
  'quarantined' : bigint,
}
export type ResolveAction = {
    'InboundReject' : {
      'token' : [] | [string],
      'chain' : EvmChain,
      'burn_id' : bigint,
      'reason' : string,
    }
  } |
  { 'OutboundMarkBurned' : { 'id' : bigint, 'icp_burn_index' : bigint } } |
  { 'OutboundMarkFailed' : { 'id' : bigint } } |
  {
    'InboundMintTo' : {
      'to' : Account,
      'token' : [] | [string],
      'chain' : EvmChain,
      'burn_id' : bigint,
    }
  } |
  {
    'InboundRetry' : {
      'token' : [] | [string],
      'chain' : EvmChain,
      'burn_id' : bigint,
    }
  } |
  {
    'InboundMarkMinted' : {
      /**
       * An earlier token of the chain; the current one when `None`.
       */
      'token' : [] | [string],
      'chain' : EvmChain,
      'icp_block_index' : bigint,
      'burn_id' : bigint,
    }
  };
export type Response = { 'Success' : null } |
  { 'InternalError' : string };
export type Result = { 'Ok' : OutboundTransfer } |
  { 'Err' : BridgeError };
export type Result_1 = { 'Ok' : Array<[Principal, Array<bigint>]> } |
  { 'Err' : GeneralError };
export type Result_2 = { 'Ok' : Array<bigint> } |
  { 'Err' : GeneralError };
export type Result_3 = { 'Ok' : ConsentInfo } |
  { 'Err' : Icrc21Error };
export type Result_4 = { 'Ok' : SwapNftForEvmOk } |
  { 'Err' : SwapNftForEvmError };
export type Result_5 = { 'Ok' : Array<bigint> } |
  { 'Err' : SwapNftForTokensErrors };
export type Result_6 = { 'Ok' : Array<bigint> } |
  { 'Err' : SwapTokensForNftErrors };
export type Result_7 = { 'Ok' : string } |
  { 'Err' : string };
export type Severity = { 'Info' : null } |
  { 'Critical' : null } |
  { 'Warning' : null };
export interface SignedEvmAdminAction {
  'id' : bigint,
  'token' : string,
  /**
   * `0x` and 65 bytes of hex.
   */
  'signature' : string,
  'calls' : Array<EvmCall>,
  'chain' : EvmChain,
  'description' : string,
  /**
   * Unix seconds.
   */
  'deadline' : bigint,
  'created_at' : bigint,
  'chain_id' : bigint,
  'nonce' : bigint,
}
/**
 * Both sides of the supply guard: minting holds while `evm_side > icp_side`.
 */
export interface SupplyGuardStatus {
  /**
   * The sum of the chains' supply readings plus every unminted inbound burn.
   */
  'evm_side' : bigint,
  /**
   * `bridged_out`.
   */
  'icp_side' : bigint,
  'holding' : boolean,
}
export interface SupplyReadingStatus {
  'block' : bigint,
  'total_supply' : bigint,
}
/**
 * The return type of the
 * [ICRC-3 `icrc3_supported_block_types`](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-3/README.md#icrc3_supported_block_types)
 * endpoint.
 */
export interface SupportedBlockType { 'url' : string, 'block_type' : string }
export interface SupportedStandard { 'url' : string, 'name' : string }
export interface SwapCanisterConfig {
  'icrc7_canister_id' : Principal,
  'fractionalization_config' : FractionalizationConfig,
}
export interface SwapInfo {
  'nft' : Nft,
  'status' : SwapStatus,
  'created_at' : bigint,
  'tokens_amount' : GeneralFractionalizationConfig,
  'user_account' : Account,
  'index' : bigint,
  'swap_type' : SwapType,
}
export interface SwapNftForEvmArgs {
  'chain' : EvmChain,
  'nfts' : Array<Nft>,
  /**
   * The EVM address that receives the GLDT.
   */
  'recipient' : string,
}
export type SwapNftForEvmError = { 'Swap' : SwapNftForTokensErrors } |
  { 'Bridge' : BridgeError };
export interface SwapNftForEvmOk {
  'swap_ids' : Array<bigint>,
  'transfer' : OutboundTransfer,
}
export type SwapNftForTokensErrors = { 'Limit' : string } |
  { 'GeneralError' : GeneralError } |
  { 'Retry' : [bigint, string] } |
  { 'CantBeAnonymous' : string };
export type SwapStatus = { 'Burned' : null } |
  { 'Failed' : string } |
  { 'NftTransferredFrom' : null } |
  { 'Init' : null } |
  { 'NftTransferred' : null } |
  { 'Complete' : null } |
  { 'BurnFailed' : string } |
  { 'ReimburseFailed' : string } |
  { 'Minted' : null } |
  { 'NftTransferFailed' : string } |
  { 'NftTransferFromFailed' : string } |
  { 'Reimbursed' : null } |
  { 'MintFailed' : string };
export type SwapTokensForNftErrors = { 'Limit' : string } |
  { 'GeneralError' : GeneralError } |
  { 'Retry' : [bigint, string] } |
  { 'NotOwnedBySwapCanister' : null } |
  { 'SwapCreationError' : null };
export type SwapType = { 'Forward' : null } |
  { 'Reverse' : null };
/**
 * The error return type for the
 * [ICRC-2 `transfer_from`](https://github.com/dfinity/ICRC-1/blob/main/standards/ICRC-2/README.md#icrc2_transfer_from)
 * endpoint.
 */
export type TransferFromError = {
    'GenericError' : { 'message' : string, 'error_code' : bigint }
  } |
  { 'TemporarilyUnavailable' : null } |
  { 'InsufficientAllowance' : { 'allowance' : bigint } } |
  { 'BadBurn' : { 'min_burn_amount' : bigint } } |
  { 'Duplicate' : { 'duplicate_of' : bigint } } |
  { 'BadFee' : { 'expected_fee' : bigint } } |
  { 'CreatedInFuture' : { 'ledger_time' : bigint } } |
  { 'TooOld' : null } |
  { 'InsufficientFunds' : { 'balance' : bigint } };
export interface UpgradeArgs {
  /**
   * Replaces the bridge config and restarts stopped chains. `None` keeps the bridge as it is.
   */
  'bridge' : [] | [BridgeUpgrade],
  /**
   * Replaces the whole list of authorized principals. `None` keeps it as it is.
   */
  'authorized_principals' : [] | [Array<Principal>],
  'version' : BuildVersion,
  'commit_hash' : string,
}
export type Value = { 'Text' : { 'content' : string } } |
  {
    'TokenAmount' : {
      'decimals' : number,
      'amount' : bigint,
      'symbol' : string,
    }
  } |
  { 'TimestampSeconds' : { 'amount' : bigint } } |
  { 'DurationSeconds' : { 'amount' : bigint } };
export type Vec = Array<
  {
    'args' : Array<{ 'start' : bigint, 'length' : bigint }>,
    'callback' : [Principal, string],
  }
>;
export interface WindowStatus {
  'to_block' : bigint,
  'end_burn_id' : bigint,
  'total_supply' : bigint,
}
export interface _SERVICE {
  /**
   * Authorized principals can pause either direction but never unpause;
   * unpausing is an SNS `SetIcpPaused` action.
   */
  'bridge_pause' : ActorMethod<[BridgePauseArgs], undefined>,
  /**
   * The bridge's SNS generic function, for ORIGYN SNS governance only. The action is
   * checked again on the current state, and any error traps, so the proposal shows as failed.
   */
  'bridge_sns_action' : ActorMethod<[BridgeSnsAction], undefined>,
  /**
   * Burns the caller's GLDT on ICP and signs a claim voucher for Ethereum or Base.
   * The caller first approves `gldt_swap` for `amount` on the GLDT ledger.
   */
  'bridge_to_evm' : ActorMethod<[BridgeToEvmArgs], Result>,
  'commit' : ActorMethod<[], undefined>,
  'get_active_swap_ids_by_user' : ActorMethod<
    [[] | [Principal]],
    Array<bigint>
  >,
  'get_active_swaps' : ActorMethod<[null], Array<[bigint, SwapInfo]>>,
  'get_active_swaps_by_ids' : ActorMethod<
    [Array<bigint>],
    Array<[bigint, SwapInfo]>
  >,
  'get_active_swaps_by_user' : ActorMethod<
    [[] | [Principal]],
    Array<[bigint, SwapInfo]>
  >,
  'get_available_nfts' : ActorMethod<[[] | [Principal]], Result_1>,
  'get_available_nfts_for_canister' : ActorMethod<[Args], Result_2>,
  /**
   * One signed admin action: anyone may submit it with `execute` on the token before its
   * deadline.
   */
  'get_bridge_admin_action' : ActorMethod<
    [bigint],
    [] | [SignedEvmAdminAction]
  >,
  /**
   * Signed admin actions, newest first. `start` is an exclusive upper bound on the id (the last
   * id of the previous page); `limit` is capped at 100.
   */
  'get_bridge_admin_actions' : ActorMethod<
    [[] | [bigint], number],
    Array<SignedEvmAdminAction>
  >,
  /**
   * The EIP-55 addresses of the claims and admin keys, once loaded.
   */
  'get_bridge_evm_signers' : ActorMethod<[], GetBridgeEvmSignersResponse>,
  'get_bridge_status' : ActorMethod<[], BridgeStatus>,
  /**
   * The inbound transfer of burn `burn_id` on the chain's current token.
   */
  'get_bridge_transfer_in' : ActorMethod<
    [EvmChain, bigint],
    [] | [InboundTransfer]
  >,
  /**
   * One outbound transfer. The frontend polls it until the status is `Signed`, then submits the
   * voucher with `claimFromIcp`. Vouchers never expire.
   */
  'get_bridge_transfer_out' : ActorMethod<[bigint], [] | [OutboundTransfer]>,
  /**
   * The account's inbound transfers, newest first. `start` skips that many (the number already
   * shown); `limit` is capped at 100.
   */
  'get_bridge_transfers_in_by_account' : ActorMethod<
    [Account, [] | [bigint], number],
    Array<InboundTransfer>
  >,
  /**
   * The saved burns of an EVM transaction, in burn id order. Lookup only: it never fetches.
   */
  'get_bridge_transfers_in_by_tx' : ActorMethod<
    [EvmChain, string],
    Array<InboundTransfer>
  >,
  /**
   * The account's outbound transfers, newest first. `start` is an exclusive upper bound on the
   * id (the last id of the previous page); `limit` is capped at 100.
   */
  'get_bridge_transfers_out_by_account' : ActorMethod<
    [Account, [] | [bigint], number],
    Array<OutboundTransfer>
  >,
  'get_failed_swap_ids_by_user' : ActorMethod<
    [[] | [Principal]],
    Array<bigint>
  >,
  'get_failed_swaps' : ActorMethod<[null], Array<[bigint, SwapInfo]>>,
  'get_failed_swaps_by_ids' : ActorMethod<
    [Array<bigint>],
    Array<[bigint, SwapInfo]>
  >,
  'get_failed_swaps_by_user' : ActorMethod<
    [[] | [Principal]],
    Array<[bigint, SwapInfo]>
  >,
  'get_swap_configs' : ActorMethod<[null], Array<SwapCanisterConfig>>,
  'icrc10_supported_standards' : ActorMethod<[], Array<SupportedStandard>>,
  'icrc21_canister_call_consent_message' : ActorMethod<
    [ConsentMessageRequest],
    Result_3
  >,
  'icrc28_trusted_origins' : ActorMethod<[], Icrc28TrustedOriginsResponse>,
  'icrc3_get_archives' : ActorMethod<[null], Array<ICRC3ArchiveInfo>>,
  'icrc3_get_blocks' : ActorMethod<
    [Array<GetBlocksRequest>],
    GetBlocksResult_1
  >,
  'icrc3_get_properties' : ActorMethod<[null], ICRC3Properties>,
  'icrc3_get_tip_certificate' : ActorMethod<[null], ICRC3DataCertificate>,
  'icrc3_supported_block_types' : ActorMethod<
    [null],
    Array<SupportedBlockType>
  >,
  'set_buyback_canister' : ActorMethod<[[] | [Account]], Response>,
  /**
   * Swaps the caller's gold NFTs for GLDT on Ethereum or Base in one call. The NFTs move to
   * gldt_swap and back the GLDT: nothing is minted or burned on ICP. The reply carries the
   * signed claim voucher, which anyone may submit with `claimFromIcp` on the token. The caller
   * first approves gldt_swap for each NFT.
   */
  'swap_nft_for_evm' : ActorMethod<[SwapNftForEvmArgs], Result_4>,
  'swap_nft_for_tokens' : ActorMethod<[Array<Nft>], Result_5>,
  'swap_tokens_for_nft' : ActorMethod<[Array<Nft>], Result_6>,
  /**
   * The SNS validator of `bridge_sns_action`: the text voters read, or why the action
   * would fail. Open to every caller, so proposers can preview the text; it only reads state.
   * An update, not a query, so SNS governance can call it.
   */
  'validate_bridge_sns_action' : ActorMethod<[BridgeSnsAction], Result_7>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
