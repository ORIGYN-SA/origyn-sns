/* eslint-disable @typescript-eslint/no-unused-vars */
export const idlFactory = ({ IDL }) => {
  const InitArgs = IDL.Record({
    ogy_legacy_minting_account_principal: IDL.Principal,
    test_mode: IDL.Bool,
    authorized_principals: IDL.Vec(IDL.Principal),
    ogy_new_ledger_canister_id: IDL.Principal,
    ogy_legacy_ledger_canister_id: IDL.Principal,
  });
  const Args = IDL.Record({ block_index: IDL.Nat64 });
  const BlockFailReason = IDL.Variant({
    ReceiverNotCorrectAccountId: IDL.Vec(IDL.Nat8),
    NotFound: IDL.Null,
    QueryRequestFailed: IDL.Null,
    SenderNotPrincipalDefaultSubaccount: IDL.Vec(IDL.Nat8),
    InvalidOperation: IDL.Null,
    AmountTooSmall: IDL.Null,
  });
  const Tokens = IDL.Record({ e8s: IDL.Nat64 });
  const TransferError = IDL.Variant({
    TxTooOld: IDL.Record({ allowed_window_nanos: IDL.Nat64 }),
    BadFee: IDL.Record({ expected_fee: Tokens }),
    TxDuplicate: IDL.Record({ duplicate_of: IDL.Nat64 }),
    TxCreatedInFuture: IDL.Null,
    InsufficientFunds: IDL.Record({ balance: Tokens }),
  });
  const BurnFailReason = IDL.Variant({
    TransferError: TransferError,
    CallError: IDL.Text,
    TokenBalanceAndSwapRequestDontMatch: IDL.Null,
  });
  const ImpossibleErrorReason = IDL.Variant({
    AmountNotFound: IDL.Null,
    PrincipalNotFound: IDL.Null,
  });
  const TransferError_1 = IDL.Variant({
    GenericError: IDL.Record({
      message: IDL.Text,
      error_code: IDL.Nat,
    }),
    TemporarilyUnavailable: IDL.Null,
    BadBurn: IDL.Record({ min_burn_amount: IDL.Nat }),
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    TooOld: IDL.Null,
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
  });
  const TransferFailReason = IDL.Variant({
    TransferError: TransferError_1,
    CallError: IDL.Text,
  });
  const SwapError = IDL.Variant({
    BlockFailed: BlockFailReason,
    BurnFailed: BurnFailReason,
    UnexpectedError: ImpossibleErrorReason,
    TransferFailed: TransferFailReason,
  });
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const TransferRequestArgs = IDL.Record({
    to: Account,
    memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(IDL.Nat64),
    amount: IDL.Nat,
  });
  const Timestamp = IDL.Record({ timestamp_nanos: IDL.Nat64 });
  const BurnRequestArgs = IDL.Record({
    memo: IDL.Nat64,
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    created_at_time: IDL.Opt(Timestamp),
    amount: Tokens,
  });
  const SwapStatus = IDL.Variant({
    Failed: SwapError,
    BurnSuccess: IDL.Null,
    Init: IDL.Null,
    BlockRequest: IDL.Nat64,
    Complete: IDL.Nat,
    TransferRequest: TransferRequestArgs,
    BurnRequest: BurnRequestArgs,
    BlockValid: IDL.Null,
  });
  const SwapInfo = IDL.Record({
    status: SwapStatus,
    last_request: IDL.Nat64,
    principal: IDL.Principal,
    token_swap_block_index: IDL.Opt(IDL.Nat),
    is_archived: IDL.Bool,
    burn_block_index: IDL.Opt(IDL.Nat64),
    first_request: IDL.Nat64,
    amount: IDL.Nat64,
  });
  const Response = IDL.Variant({
    Success: SwapInfo,
    InternalError: IDL.Text,
  });
  const UserSwap = IDL.Record({
    desposit_account: IDL.Vec(IDL.Nat8),
    swaps: IDL.Nat64,
    amount: IDL.Nat64,
  });
  const SwapStatistics = IDL.Record({
    number_of_completed_swaps: IDL.Nat64,
    user_swaps: IDL.Vec(IDL.Tuple(IDL.Principal, UserSwap)),
    number_of_failed_swaps: IDL.Nat64,
    total_amount_swapped: IDL.Nat64,
    number_of_attempted_swaps: IDL.Nat64,
  });
  const Args_1 = IDL.Record({ of: IDL.Opt(IDL.Principal) });
  const Response_1 = IDL.Variant({
    NotAuthorized: IDL.Text,
    Success: IDL.Vec(IDL.Nat8),
    MaxCapacityOfListReached: IDL.Null,
    MaxCapacityOfSwapsReached: IDL.Null,
  });
  const Args_2 = IDL.Record({
    block_index: IDL.Nat64,
    user: IDL.Opt(IDL.Principal),
  });
  const Response_2 = IDL.Variant({
    Success: IDL.Nat,
    InternalError: IDL.Text,
  });
  const Response_3 = IDL.Variant({
    TransferError: IDL.Text,
    FailedToFetchBalance: IDL.Text,
    InsufficientBalance: IDL.Nat64,
    TransferCallError: IDL.Text,
    NoRecordOfSubaccountRequestFound: IDL.Null,
    Success: IDL.Nat64,
    InternalError: IDL.Text,
  });
  return IDL.Service({
    get_swap_info: IDL.Func([Args], [Response], ["query"]),
    is_caller_whitelisted: IDL.Func([], [IDL.Bool], ["query"]),
    list_swapping_statistics: IDL.Func([], [SwapStatistics], ["query"]),
    request_deposit_account: IDL.Func([Args_1], [Response_1], []),
    swap_tokens: IDL.Func([Args_2], [Response_2], []),
    withdraw_deposit: IDL.Func([], [Response_3], []),
  });
};
export const init = ({ IDL }) => {
  const InitArgs = IDL.Record({
    ogy_legacy_minting_account_principal: IDL.Principal,
    test_mode: IDL.Bool,
    authorized_principals: IDL.Vec(IDL.Principal),
    ogy_new_ledger_canister_id: IDL.Principal,
    ogy_legacy_ledger_canister_id: IDL.Principal,
  });
  return [InitArgs];
};
