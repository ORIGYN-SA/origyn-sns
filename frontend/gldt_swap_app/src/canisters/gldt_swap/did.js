export const idlFactory = ({ IDL }) => {
  const ICRC3Value = IDL.Rec();
  const Vec = IDL.Rec();
  const EvmChain = IDL.Variant({ 'Base' : IDL.Null, 'Ethereum' : IDL.Null });
  const ChainReset = IDL.Record({
    'chain' : EvmChain,
    'last_scraped_block' : IDL.Nat64,
    'next_burn_id' : IDL.Nat64,
  });
  const EvmProvider = IDL.Variant({
    'Alchemy' : IDL.Null,
    'Llama' : IDL.Null,
    'BlockPi' : IDL.Null,
    'Cloudflare' : IDL.Null,
    'PublicNode' : IDL.Null,
    'Ankr' : IDL.Null,
    'Custom' : IDL.Record({ 'url' : IDL.Text }),
  });
  const ChainConfig = IDL.Record({
    'confirmations' : IDL.Nat64,
    'token' : IDL.Text,
    'chain' : EvmChain,
    'scrape_interval_secs' : IDL.Nat64,
    'max_window_blocks' : IDL.Nat64,
    'lz_endpoint' : IDL.Text,
    'chain_id' : IDL.Nat64,
    'head_rpc_url' : IDL.Text,
    'lz_eid' : IDL.Nat32,
    'providers' : IDL.Vec(EvmProvider),
    'log_batch_size' : IDL.Nat32,
  });
  const BridgeConfig = IDL.Record({
    'ecdsa_key_name' : IDL.Text,
    'admin_action_max_validity_secs' : IDL.Nat64,
    'sns_governance' : IDL.Principal,
    'chains' : IDL.Vec(ChainConfig),
    'admin_action_validity_secs' : IDL.Nat64,
    'evm_rpc_canister' : IDL.Principal,
  });
  const BridgeUpgrade = IDL.Record({
    'chain_resets' : IDL.Vec(ChainReset),
    'config' : IDL.Opt(BridgeConfig),
    'skip_to_head' : IDL.Opt(IDL.Vec(EvmChain)),
  });
  const BuildVersion = IDL.Record({
    'major' : IDL.Nat32,
    'minor' : IDL.Nat32,
    'patch' : IDL.Nat32,
  });
  const UpgradeArgs = IDL.Record({
    'bridge' : IDL.Opt(BridgeUpgrade),
    'authorized_principals' : IDL.Opt(IDL.Vec(IDL.Principal)),
    'version' : BuildVersion,
    'commit_hash' : IDL.Text,
  });
  const Account = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const Duration = IDL.Record({ 'secs' : IDL.Nat64, 'nanos' : IDL.Nat32 });
  const ICRC3Properties = IDL.Record({
    'max_blocks_per_response' : IDL.Nat,
    'initial_cycles' : IDL.Nat,
    'tx_window' : Duration,
    'max_transactions_to_purge' : IDL.Nat,
    'max_memory_size_bytes' : IDL.Nat,
    'ttl_for_non_archived_transactions' : Duration,
    'max_transactions_in_window' : IDL.Nat,
    'max_unarchived_transactions' : IDL.Nat,
    'reserved_cycles' : IDL.Nat,
  });
  const SupportedBlockType = IDL.Record({
    'url' : IDL.Text,
    'block_type' : IDL.Text,
  });
  const ICRC3Config = IDL.Record({
    'constants' : ICRC3Properties,
    'supported_blocks' : IDL.Vec(SupportedBlockType),
  });
  const GeneralFractionalizationConfig = IDL.Record({
    'division' : IDL.Nat64,
    'ledger_id' : IDL.Principal,
    'swap_fee' : IDL.Nat,
  });
  const CustomFractionalizationConfig = IDL.Record({
    'per_token_config' : IDL.Vec(
      IDL.Tuple(IDL.Nat, GeneralFractionalizationConfig)
    ),
  });
  const FractionalizationConfig = IDL.Variant({
    'Custom' : CustomFractionalizationConfig,
    'General' : GeneralFractionalizationConfig,
  });
  const SwapCanisterConfig = IDL.Record({
    'icrc7_canister_id' : IDL.Principal,
    'fractionalization_config' : FractionalizationConfig,
  });
  const InitArgs = IDL.Record({
    'buyback_burn_canister' : IDL.Opt(Account),
    'bridge' : IDL.Opt(BridgeUpgrade),
    'test_mode' : IDL.Bool,
    'authorized_principals' : IDL.Vec(IDL.Principal),
    'version' : BuildVersion,
    'icrc3_config' : ICRC3Config,
    'gldt_swap_old_archive' : IDL.Principal,
    'commit_hash' : IDL.Text,
    'swap_configs' : IDL.Vec(SwapCanisterConfig),
  });
  const Args_1 = IDL.Variant({ 'Upgrade' : UpgradeArgs, 'Init' : InitArgs });
  const BridgePauseArgs = IDL.Record({
    'inbound' : IDL.Bool,
    'outbound' : IDL.Bool,
  });
  const EvmAdminAction = IDL.Variant({
    'SetSendLibrary' : IDL.Record({ 'eid' : IDL.Nat32, 'lib' : IDL.Text }),
    'CancelNonce' : IDL.Record({ 'nonce' : IDL.Nat64 }),
    'SetLzReceiveGas' : IDL.Record({ 'gas' : IDL.Nat, 'dst_eid' : IDL.Nat32 }),
    'Upgrade' : IDL.Record({
      'implementation' : IDL.Text,
      'code_hash' : IDL.Text,
    }),
    'SetExecutorConfig' : IDL.Record({
      'eid' : IDL.Nat32,
      'lib' : IDL.Text,
      'max_message_size' : IDL.Nat32,
      'executor' : IDL.Text,
    }),
    'SetUlnConfig' : IDL.Record({
      'eid' : IDL.Nat32,
      'lib' : IDL.Text,
      'confirmations' : IDL.Nat64,
      'required_dvns' : IDL.Vec(IDL.Text),
      'optional_dvns' : IDL.Vec(IDL.Text),
      'optional_threshold' : IDL.Nat8,
    }),
    'SetAdminSigner' : IDL.Record({ 'signer' : IDL.Text }),
    'BurnLzMessage' : IDL.Record({
      'sender' : IDL.Text,
      'src_eid' : IDL.Nat32,
      'nonce' : IDL.Nat64,
      'payload_hash' : IDL.Text,
    }),
    'SetOperator' : IDL.Record({ 'operator' : IDL.Opt(IDL.Text) }),
    'SetReceiveLibrary' : IDL.Record({
      'eid' : IDL.Nat32,
      'lib' : IDL.Text,
      'grace_period' : IDL.Nat,
    }),
    'SetMinBurnToIcp' : IDL.Record({ 'amount' : IDL.Nat }),
    'SetIcpSigner' : IDL.Record({ 'signer' : IDL.Text }),
    'SetPeer' : IDL.Record({ 'eid' : IDL.Nat32, 'peer' : IDL.Text }),
    'SetPaused' : IDL.Record({
      'lz_paused' : IDL.Bool,
      'icp_bridge_paused' : IDL.Bool,
    }),
  });
  const EvmAdminRequest = IDL.Record({
    'chain' : EvmChain,
    'actions' : IDL.Vec(EvmAdminAction),
    'valid_for_secs' : IDL.Opt(IDL.Nat64),
  });
  const ResolveAction = IDL.Variant({
    'InboundReject' : IDL.Record({
      'token' : IDL.Opt(IDL.Text),
      'chain' : EvmChain,
      'burn_id' : IDL.Nat64,
      'reason' : IDL.Text,
    }),
    'OutboundMarkBurned' : IDL.Record({
      'id' : IDL.Nat64,
      'icp_burn_index' : IDL.Nat64,
    }),
    'OutboundMarkFailed' : IDL.Record({ 'id' : IDL.Nat64 }),
    'InboundMintTo' : IDL.Record({
      'to' : Account,
      'token' : IDL.Opt(IDL.Text),
      'chain' : EvmChain,
      'burn_id' : IDL.Nat64,
    }),
    'InboundRetry' : IDL.Record({
      'token' : IDL.Opt(IDL.Text),
      'chain' : EvmChain,
      'burn_id' : IDL.Nat64,
    }),
    'InboundMarkMinted' : IDL.Record({
      'token' : IDL.Opt(IDL.Text),
      'chain' : EvmChain,
      'icp_block_index' : IDL.Nat64,
      'burn_id' : IDL.Nat64,
    }),
  });
  const BridgeSnsAction = IDL.Variant({
    'SignEvmAdmin' : IDL.Vec(EvmAdminRequest),
    'Resolve' : IDL.Vec(ResolveAction),
    'SetIcpPaused' : IDL.Record({
      'inbound' : IDL.Opt(IDL.Bool),
      'outbound' : IDL.Opt(IDL.Bool),
    }),
  });
  const BridgeToEvmArgs = IDL.Record({
    'chain' : EvmChain,
    'recipient' : IDL.Text,
    'from_subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'amount' : IDL.Nat,
  });
  const EvmVoucher = IDL.Record({
    'token' : IDL.Text,
    'signature' : IDL.Text,
    'recipient' : IDL.Text,
    'icp_burn_index' : IDL.Nat64,
    'chain_id' : IDL.Nat64,
    'amount' : IDL.Nat,
  });
  const OutboundStatus = IDL.Variant({
    'Burned' : IDL.Record({ 'icp_burn_index' : IDL.Nat64 }),
    'Failed' : IDL.Text,
    'NeedsManualCheck' : IDL.Text,
    'BurnUnknown' : IDL.Null,
    'Burning' : IDL.Null,
    'Signed' : EvmVoucher,
  });
  const OutboundTransfer = IDL.Record({
    'id' : IDL.Nat64,
    'status' : OutboundStatus,
    'from' : Account,
    'chain' : EvmChain,
    'recipient' : IDL.Text,
    'created_at' : IDL.Nat64,
    'amount' : IDL.Nat,
  });
  const TransferFromError = IDL.Variant({
    'GenericError' : IDL.Record({
      'message' : IDL.Text,
      'error_code' : IDL.Nat,
    }),
    'TemporarilyUnavailable' : IDL.Null,
    'InsufficientAllowance' : IDL.Record({ 'allowance' : IDL.Nat }),
    'BadBurn' : IDL.Record({ 'min_burn_amount' : IDL.Nat }),
    'Duplicate' : IDL.Record({ 'duplicate_of' : IDL.Nat }),
    'BadFee' : IDL.Record({ 'expected_fee' : IDL.Nat }),
    'CreatedInFuture' : IDL.Record({ 'ledger_time' : IDL.Nat64 }),
    'TooOld' : IDL.Null,
    'InsufficientFunds' : IDL.Record({ 'balance' : IDL.Nat }),
  });
  const BridgeError = IDL.Variant({
    'Paused' : IDL.Null,
    'Burn' : TransferFromError,
    'Busy' : IDL.Null,
    'UnknownChain' : IDL.Null,
    'NotReady' : IDL.Text,
    'ZeroAmount' : IDL.Null,
    'InvalidRecipient' : IDL.Null,
  });
  const Result = IDL.Variant({ 'Ok' : OutboundTransfer, 'Err' : BridgeError });
  const Nft = IDL.Record({ 'id' : IDL.Nat, 'canister_id' : IDL.Principal });
  const SwapStatus = IDL.Variant({
    'Burned' : IDL.Null,
    'Failed' : IDL.Text,
    'NftTransferredFrom' : IDL.Null,
    'Init' : IDL.Null,
    'NftTransferred' : IDL.Null,
    'Complete' : IDL.Null,
    'BurnFailed' : IDL.Text,
    'ReimburseFailed' : IDL.Text,
    'Minted' : IDL.Null,
    'NftTransferFailed' : IDL.Text,
    'NftTransferFromFailed' : IDL.Text,
    'Reimbursed' : IDL.Null,
    'MintFailed' : IDL.Text,
  });
  const SwapType = IDL.Variant({ 'Forward' : IDL.Null, 'Reverse' : IDL.Null });
  const SwapInfo = IDL.Record({
    'nft' : Nft,
    'status' : SwapStatus,
    'created_at' : IDL.Nat64,
    'tokens_amount' : GeneralFractionalizationConfig,
    'user_account' : Account,
    'index' : IDL.Nat,
    'swap_type' : SwapType,
  });
  const GeneralError = IDL.Variant({
    'InvalidConfig' : IDL.Text,
    'InvalidNftCanister' : IDL.Text,
    'TransactionAddError' : IDL.Text,
    'TransferError' : IDL.Text,
    'UserIsNotNftOwner' : IDL.Text,
    'AlreadyProcessing' : IDL.Text,
    'TransactionPreparationError' : IDL.Text,
    'InvalidPrincipal' : IDL.Text,
    'NotAuthorized' : IDL.Text,
    'EmptyArgs' : IDL.Text,
    'CallError' : IDL.Text,
    'CanisterIsNotNftOwner' : IDL.Text,
    'ConfigNotFound' : IDL.Text,
    'InvalidPercentage' : IDL.Text,
  });
  const Result_1 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Vec(IDL.Nat))),
    'Err' : GeneralError,
  });
  const Args = IDL.Record({
    'principal' : IDL.Opt(IDL.Principal),
    'canister_id' : IDL.Principal,
  });
  const Result_2 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Nat),
    'Err' : GeneralError,
  });
  const EvmCall = IDL.Record({
    'data' : IDL.Vec(IDL.Nat8),
    'target' : IDL.Text,
  });
  const SignedEvmAdminAction = IDL.Record({
    'id' : IDL.Nat64,
    'token' : IDL.Text,
    'signature' : IDL.Text,
    'calls' : IDL.Vec(EvmCall),
    'chain' : EvmChain,
    'description' : IDL.Text,
    'deadline' : IDL.Nat64,
    'created_at' : IDL.Nat64,
    'chain_id' : IDL.Nat64,
    'nonce' : IDL.Nat64,
  });
  const GetBridgeEvmSignersResponse = IDL.Record({
    'claims' : IDL.Opt(IDL.Text),
    'admin' : IDL.Opt(IDL.Text),
  });
  const SupplyGuardStatus = IDL.Record({
    'evm_side' : IDL.Nat,
    'icp_side' : IDL.Nat,
    'holding' : IDL.Bool,
  });
  const Severity = IDL.Variant({
    'Info' : IDL.Null,
    'Critical' : IDL.Null,
    'Warning' : IDL.Null,
  });
  const Alert = IDL.Record({
    'time' : IDL.Nat64,
    'message' : IDL.Text,
    'severity' : Severity,
  });
  const QueueSizes = IDL.Record({
    'needs_manual_check' : IDL.Nat64,
    'mint_unknown' : IDL.Nat64,
    'queued' : IDL.Nat64,
    'quarantined' : IDL.Nat64,
  });
  const WindowStatus = IDL.Record({
    'to_block' : IDL.Nat64,
    'end_burn_id' : IDL.Nat64,
    'total_supply' : IDL.Nat,
  });
  const SupplyReadingStatus = IDL.Record({
    'block' : IDL.Nat64,
    'total_supply' : IDL.Nat,
  });
  const ChainStatus = IDL.Record({
    'last_error' : IDL.Opt(IDL.Text),
    'token' : IDL.Text,
    'stopped' : IDL.Opt(IDL.Text),
    'chain' : EvmChain,
    'window' : IDL.Opt(WindowStatus),
    'last_scraped_block' : IDL.Nat64,
    'chain_id' : IDL.Nat64,
    'supply' : IDL.Opt(SupplyReadingStatus),
    'next_burn_id' : IDL.Nat64,
    'failed_ticks' : IDL.Nat32,
    'last_ok_at' : IDL.Opt(IDL.Nat64),
    'start_block' : IDL.Opt(IDL.Nat64),
  });
  const OutboundCounts = IDL.Record({
    'needs_manual_check' : IDL.Nat64,
    'burn_unknown' : IDL.Nat64,
    'burning' : IDL.Nat64,
    'burned' : IDL.Nat64,
  });
  const BridgeStatus = IDL.Record({
    'claims_signer' : IDL.Opt(IDL.Text),
    'paused_out' : IDL.Bool,
    'supply_guard' : SupplyGuardStatus,
    'alerts' : IDL.Vec(Alert),
    'admin_signer' : IDL.Opt(IDL.Text),
    'paused_in' : IDL.Bool,
    'queue' : QueueSizes,
    'cycles' : IDL.Nat,
    'configured' : IDL.Bool,
    'chains' : IDL.Vec(ChainStatus),
    'alerts_total' : IDL.Nat64,
    'out_pending' : IDL.Nat,
    'bridged_out' : IDL.Nat,
    'outbound' : OutboundCounts,
  });
  const InboundStatus = IDL.Variant({
    'Queued' : IDL.Null,
    'NeedsManualCheck' : IDL.Text,
    'Rejected' : IDL.Text,
    'Minted' : IDL.Record({ 'icp_block_index' : IDL.Nat64 }),
    'Quarantined' : IDL.Text,
    'MintUnknown' : IDL.Null,
  });
  const InboundTransfer = IDL.Record({
    'to' : Account,
    'status' : InboundStatus,
    'token' : IDL.Text,
    'log_index' : IDL.Nat64,
    'chain' : EvmChain,
    'evm_from' : IDL.Text,
    'block_number' : IDL.Nat64,
    'burn_id' : IDL.Nat64,
    'discovered_at' : IDL.Nat64,
    'tx_hash' : IDL.Text,
    'amount' : IDL.Nat,
  });
  const SupportedStandard = IDL.Record({ 'url' : IDL.Text, 'name' : IDL.Text });
  const ConsentMessageMetadata = IDL.Record({
    'utc_offset_minutes' : IDL.Opt(IDL.Int16),
    'language' : IDL.Text,
  });
  const DisplayMessageType = IDL.Variant({
    'GenericDisplay' : IDL.Null,
    'FieldsDisplay' : IDL.Null,
  });
  const ConsentMessageSpec = IDL.Record({
    'metadata' : ConsentMessageMetadata,
    'device_spec' : IDL.Opt(DisplayMessageType),
  });
  const ConsentMessageRequest = IDL.Record({
    'arg' : IDL.Vec(IDL.Nat8),
    'method' : IDL.Text,
    'user_preferences' : ConsentMessageSpec,
  });
  const Value = IDL.Variant({
    'Text' : IDL.Record({ 'content' : IDL.Text }),
    'TokenAmount' : IDL.Record({
      'decimals' : IDL.Nat8,
      'amount' : IDL.Nat64,
      'symbol' : IDL.Text,
    }),
    'TimestampSeconds' : IDL.Record({ 'amount' : IDL.Nat64 }),
    'DurationSeconds' : IDL.Record({ 'amount' : IDL.Nat64 }),
  });
  const FieldsDisplay = IDL.Record({
    'fields' : IDL.Vec(IDL.Tuple(IDL.Text, Value)),
    'intent' : IDL.Text,
  });
  const ConsentMessage = IDL.Variant({
    'FieldsDisplayMessage' : FieldsDisplay,
    'GenericDisplayMessage' : IDL.Text,
  });
  const ConsentInfo = IDL.Record({
    'metadata' : ConsentMessageMetadata,
    'consent_message' : ConsentMessage,
  });
  const ErrorInfo = IDL.Record({ 'description' : IDL.Text });
  const Icrc21Error = IDL.Variant({
    'GenericError' : IDL.Record({
      'description' : IDL.Text,
      'error_code' : IDL.Nat,
    }),
    'InsufficientPayment' : ErrorInfo,
    'UnsupportedCanisterCall' : ErrorInfo,
    'ConsentMessageUnavailable' : ErrorInfo,
  });
  const Result_3 = IDL.Variant({ 'Ok' : ConsentInfo, 'Err' : Icrc21Error });
  const Icrc28TrustedOriginsResponse = IDL.Record({
    'trusted_origins' : IDL.Vec(IDL.Text),
  });
  const ICRC3ArchiveInfo = IDL.Record({
    'end' : IDL.Nat,
    'canister_id' : IDL.Principal,
    'start' : IDL.Nat,
  });
  const GetBlocksRequest = IDL.Record({
    'start' : IDL.Nat,
    'length' : IDL.Nat,
  });
  ICRC3Value.fill(
    IDL.Variant({
      'Int' : IDL.Int,
      'Map' : IDL.Vec(IDL.Tuple(IDL.Text, ICRC3Value)),
      'Nat' : IDL.Nat,
      'Blob' : IDL.Vec(IDL.Nat8),
      'Text' : IDL.Text,
      'Array' : IDL.Vec(ICRC3Value),
    })
  );
  const BlockWithId = IDL.Record({ 'id' : IDL.Nat, 'block' : ICRC3Value });
  Vec.fill(
    IDL.Vec(
      IDL.Record({
        'args' : IDL.Vec(IDL.Record({ 'start' : IDL.Nat, 'length' : IDL.Nat })),
        'callback' : IDL.Func(
            [IDL.Vec(IDL.Record({ 'start' : IDL.Nat, 'length' : IDL.Nat }))],
            [
              IDL.Record({
                'log_length' : IDL.Nat,
                'blocks' : IDL.Vec(
                  IDL.Record({
                    'id' : IDL.Nat,
                    'block' : IDL.Variant({
                      'Int' : IDL.Int,
                      'Map' : IDL.Vec(IDL.Tuple(IDL.Text, ICRC3Value)),
                      'Nat' : IDL.Nat,
                      'Blob' : IDL.Vec(IDL.Nat8),
                      'Text' : IDL.Text,
                      'Array' : IDL.Vec(ICRC3Value),
                    }),
                  })
                ),
                'archived_blocks' : Vec,
              }),
            ],
            ['query'],
          ),
      })
    )
  );
  const GetBlocksResult = IDL.Record({
    'log_length' : IDL.Nat,
    'blocks' : IDL.Vec(BlockWithId),
    'archived_blocks' : Vec,
  });
  const ArchivedBlocks = IDL.Record({
    'args' : IDL.Vec(GetBlocksRequest),
    'callback' : IDL.Func(
        [IDL.Vec(GetBlocksRequest)],
        [GetBlocksResult],
        ['query'],
      ),
  });
  const GetBlocksResult_1 = IDL.Record({
    'log_length' : IDL.Nat,
    'blocks' : IDL.Vec(BlockWithId),
    'archived_blocks' : IDL.Vec(ArchivedBlocks),
  });
  const ICRC3DataCertificate = IDL.Record({
    'certificate' : IDL.Vec(IDL.Nat8),
    'hash_tree' : IDL.Vec(IDL.Nat8),
  });
  const Response = IDL.Variant({
    'Success' : IDL.Null,
    'InternalError' : IDL.Text,
  });
  const SwapNftForEvmArgs = IDL.Record({
    'chain' : EvmChain,
    'nfts' : IDL.Vec(Nft),
    'recipient' : IDL.Text,
  });
  const SwapNftForEvmOk = IDL.Record({
    'swap_ids' : IDL.Vec(IDL.Nat),
    'transfer' : OutboundTransfer,
  });
  const SwapNftForTokensErrors = IDL.Variant({
    'Limit' : IDL.Text,
    'GeneralError' : GeneralError,
    'Retry' : IDL.Tuple(IDL.Nat64, IDL.Text),
    'CantBeAnonymous' : IDL.Text,
  });
  const SwapNftForEvmError = IDL.Variant({
    'Swap' : SwapNftForTokensErrors,
    'Bridge' : BridgeError,
  });
  const Result_4 = IDL.Variant({
    'Ok' : SwapNftForEvmOk,
    'Err' : SwapNftForEvmError,
  });
  const Result_5 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Nat),
    'Err' : SwapNftForTokensErrors,
  });
  const SwapTokensForNftErrors = IDL.Variant({
    'Limit' : IDL.Text,
    'GeneralError' : GeneralError,
    'Retry' : IDL.Tuple(IDL.Nat64, IDL.Text),
    'NotOwnedBySwapCanister' : IDL.Null,
    'SwapCreationError' : IDL.Null,
  });
  const Result_6 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Nat),
    'Err' : SwapTokensForNftErrors,
  });
  const Result_7 = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  return IDL.Service({
    'bridge_pause' : IDL.Func([BridgePauseArgs], [], []),
    'bridge_sns_action' : IDL.Func([BridgeSnsAction], [], []),
    'bridge_to_evm' : IDL.Func([BridgeToEvmArgs], [Result], []),
    'commit' : IDL.Func([], [], []),
    'get_active_swap_ids_by_user' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Vec(IDL.Nat)],
        ['query'],
      ),
    'get_active_swaps' : IDL.Func(
        [IDL.Null],
        [IDL.Vec(IDL.Tuple(IDL.Nat, SwapInfo))],
        ['query'],
      ),
    'get_active_swaps_by_ids' : IDL.Func(
        [IDL.Vec(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, SwapInfo))],
        ['query'],
      ),
    'get_active_swaps_by_user' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, SwapInfo))],
        ['query'],
      ),
    'get_available_nfts' : IDL.Func([IDL.Opt(IDL.Principal)], [Result_1], []),
    'get_available_nfts_for_canister' : IDL.Func([Args], [Result_2], []),
    'get_bridge_admin_action' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(SignedEvmAdminAction)],
        ['query'],
      ),
    'get_bridge_admin_actions' : IDL.Func(
        [IDL.Opt(IDL.Nat64), IDL.Nat32],
        [IDL.Vec(SignedEvmAdminAction)],
        ['query'],
      ),
    'get_bridge_evm_signers' : IDL.Func(
        [],
        [GetBridgeEvmSignersResponse],
        ['query'],
      ),
    'get_bridge_status' : IDL.Func([], [BridgeStatus], ['query']),
    'get_bridge_transfer_in' : IDL.Func(
        [EvmChain, IDL.Nat64],
        [IDL.Opt(InboundTransfer)],
        ['query'],
      ),
    'get_bridge_transfer_out' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(OutboundTransfer)],
        ['query'],
      ),
    'get_bridge_transfers_in_by_account' : IDL.Func(
        [Account, IDL.Opt(IDL.Nat64), IDL.Nat32],
        [IDL.Vec(InboundTransfer)],
        ['query'],
      ),
    'get_bridge_transfers_in_by_tx' : IDL.Func(
        [EvmChain, IDL.Text],
        [IDL.Vec(InboundTransfer)],
        ['query'],
      ),
    'get_bridge_transfers_out_by_account' : IDL.Func(
        [Account, IDL.Opt(IDL.Nat64), IDL.Nat32],
        [IDL.Vec(OutboundTransfer)],
        ['query'],
      ),
    'get_failed_swap_ids_by_user' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Vec(IDL.Nat)],
        ['query'],
      ),
    'get_failed_swaps' : IDL.Func(
        [IDL.Null],
        [IDL.Vec(IDL.Tuple(IDL.Nat, SwapInfo))],
        ['query'],
      ),
    'get_failed_swaps_by_ids' : IDL.Func(
        [IDL.Vec(IDL.Nat)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, SwapInfo))],
        ['query'],
      ),
    'get_failed_swaps_by_user' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Vec(IDL.Tuple(IDL.Nat, SwapInfo))],
        ['query'],
      ),
    'get_swap_configs' : IDL.Func(
        [IDL.Null],
        [IDL.Vec(SwapCanisterConfig)],
        ['query'],
      ),
    'icrc10_supported_standards' : IDL.Func(
        [],
        [IDL.Vec(SupportedStandard)],
        ['query'],
      ),
    'icrc21_canister_call_consent_message' : IDL.Func(
        [ConsentMessageRequest],
        [Result_3],
        ['query'],
      ),
    'icrc28_trusted_origins' : IDL.Func([], [Icrc28TrustedOriginsResponse], []),
    'icrc3_get_archives' : IDL.Func(
        [IDL.Null],
        [IDL.Vec(ICRC3ArchiveInfo)],
        ['query'],
      ),
    'icrc3_get_blocks' : IDL.Func(
        [IDL.Vec(GetBlocksRequest)],
        [GetBlocksResult_1],
        ['query'],
      ),
    'icrc3_get_properties' : IDL.Func([IDL.Null], [ICRC3Properties], ['query']),
    'icrc3_get_tip_certificate' : IDL.Func(
        [IDL.Null],
        [ICRC3DataCertificate],
        ['query'],
      ),
    'icrc3_supported_block_types' : IDL.Func(
        [IDL.Null],
        [IDL.Vec(SupportedBlockType)],
        ['query'],
      ),
    'set_buyback_canister' : IDL.Func([IDL.Opt(Account)], [Response], []),
    'swap_nft_for_evm' : IDL.Func([SwapNftForEvmArgs], [Result_4], []),
    'swap_nft_for_tokens' : IDL.Func([IDL.Vec(Nft)], [Result_5], []),
    'swap_tokens_for_nft' : IDL.Func([IDL.Vec(Nft)], [Result_6], []),
    'validate_bridge_sns_action' : IDL.Func([BridgeSnsAction], [Result_7], []),
  });
};
export const init = ({ IDL }) => {
  const EvmChain = IDL.Variant({ 'Base' : IDL.Null, 'Ethereum' : IDL.Null });
  const ChainReset = IDL.Record({
    'chain' : EvmChain,
    'last_scraped_block' : IDL.Nat64,
    'next_burn_id' : IDL.Nat64,
  });
  const EvmProvider = IDL.Variant({
    'Alchemy' : IDL.Null,
    'Llama' : IDL.Null,
    'BlockPi' : IDL.Null,
    'Cloudflare' : IDL.Null,
    'PublicNode' : IDL.Null,
    'Ankr' : IDL.Null,
    'Custom' : IDL.Record({ 'url' : IDL.Text }),
  });
  const ChainConfig = IDL.Record({
    'confirmations' : IDL.Nat64,
    'token' : IDL.Text,
    'chain' : EvmChain,
    'scrape_interval_secs' : IDL.Nat64,
    'max_window_blocks' : IDL.Nat64,
    'lz_endpoint' : IDL.Text,
    'chain_id' : IDL.Nat64,
    'head_rpc_url' : IDL.Text,
    'lz_eid' : IDL.Nat32,
    'providers' : IDL.Vec(EvmProvider),
    'log_batch_size' : IDL.Nat32,
  });
  const BridgeConfig = IDL.Record({
    'ecdsa_key_name' : IDL.Text,
    'admin_action_max_validity_secs' : IDL.Nat64,
    'sns_governance' : IDL.Principal,
    'chains' : IDL.Vec(ChainConfig),
    'admin_action_validity_secs' : IDL.Nat64,
    'evm_rpc_canister' : IDL.Principal,
  });
  const BridgeUpgrade = IDL.Record({
    'chain_resets' : IDL.Vec(ChainReset),
    'config' : IDL.Opt(BridgeConfig),
    'skip_to_head' : IDL.Opt(IDL.Vec(EvmChain)),
  });
  const BuildVersion = IDL.Record({
    'major' : IDL.Nat32,
    'minor' : IDL.Nat32,
    'patch' : IDL.Nat32,
  });
  const UpgradeArgs = IDL.Record({
    'bridge' : IDL.Opt(BridgeUpgrade),
    'authorized_principals' : IDL.Opt(IDL.Vec(IDL.Principal)),
    'version' : BuildVersion,
    'commit_hash' : IDL.Text,
  });
  const Account = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const Duration = IDL.Record({ 'secs' : IDL.Nat64, 'nanos' : IDL.Nat32 });
  const ICRC3Properties = IDL.Record({
    'max_blocks_per_response' : IDL.Nat,
    'initial_cycles' : IDL.Nat,
    'tx_window' : Duration,
    'max_transactions_to_purge' : IDL.Nat,
    'max_memory_size_bytes' : IDL.Nat,
    'ttl_for_non_archived_transactions' : Duration,
    'max_transactions_in_window' : IDL.Nat,
    'max_unarchived_transactions' : IDL.Nat,
    'reserved_cycles' : IDL.Nat,
  });
  const SupportedBlockType = IDL.Record({
    'url' : IDL.Text,
    'block_type' : IDL.Text,
  });
  const ICRC3Config = IDL.Record({
    'constants' : ICRC3Properties,
    'supported_blocks' : IDL.Vec(SupportedBlockType),
  });
  const GeneralFractionalizationConfig = IDL.Record({
    'division' : IDL.Nat64,
    'ledger_id' : IDL.Principal,
    'swap_fee' : IDL.Nat,
  });
  const CustomFractionalizationConfig = IDL.Record({
    'per_token_config' : IDL.Vec(
      IDL.Tuple(IDL.Nat, GeneralFractionalizationConfig)
    ),
  });
  const FractionalizationConfig = IDL.Variant({
    'Custom' : CustomFractionalizationConfig,
    'General' : GeneralFractionalizationConfig,
  });
  const SwapCanisterConfig = IDL.Record({
    'icrc7_canister_id' : IDL.Principal,
    'fractionalization_config' : FractionalizationConfig,
  });
  const InitArgs = IDL.Record({
    'buyback_burn_canister' : IDL.Opt(Account),
    'bridge' : IDL.Opt(BridgeUpgrade),
    'test_mode' : IDL.Bool,
    'authorized_principals' : IDL.Vec(IDL.Principal),
    'version' : BuildVersion,
    'icrc3_config' : ICRC3Config,
    'gldt_swap_old_archive' : IDL.Principal,
    'commit_hash' : IDL.Text,
    'swap_configs' : IDL.Vec(SwapCanisterConfig),
  });
  const Args_1 = IDL.Variant({ 'Upgrade' : UpgradeArgs, 'Init' : InitArgs });
  return [Args_1];
};
