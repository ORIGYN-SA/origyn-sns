export const idlFactory = ({ IDL }) => {
  const InitArgs = IDL.Record({
    'ogy_legacy_minting_account_principal' : IDL.Principal,
    'test_mode' : IDL.Bool,
    'ogy_new_ledger_canister_id' : IDL.Principal,
    'ogy_legacy_ledger_canister_id' : IDL.Principal,
  });
  const BlockFailReason = IDL.Variant({
    'ReceiverNotCorrectAccountId' : IDL.Vec(IDL.Nat8),
    'NotFound' : IDL.Null,
    'QueryRequestFailed' : IDL.Null,
    'SenderNotPrincipalDefaultSubaccount' : IDL.Vec(IDL.Nat8),
    'InvalidOperation' : IDL.Null,
    'AmountTooSmall' : IDL.Null,
  });
  const Tokens = IDL.Record({ 'e8s' : IDL.Nat64 });
  const TransferError = IDL.Variant({
    'TxTooOld' : IDL.Record({ 'allowed_window_nanos' : IDL.Nat64 }),
    'BadFee' : IDL.Record({ 'expected_fee' : Tokens }),
    'TxDuplicate' : IDL.Record({ 'duplicate_of' : IDL.Nat64 }),
    'TxCreatedInFuture' : IDL.Null,
    'InsufficientFunds' : IDL.Record({ 'balance' : Tokens }),
  });
  const BurnFailReason = IDL.Variant({
    'TransferError' : TransferError,
    'CallError' : IDL.Text,
  });
  const ImpossibleErrorReason = IDL.Variant({
    'AmountNotFound' : IDL.Null,
    'PrincipalNotFound' : IDL.Null,
  });
  const TransferError_1 = IDL.Variant({
    'GenericError' : IDL.Record({
      'message' : IDL.Text,
      'error_code' : IDL.Nat,
    }),
    'TemporarilyUnavailable' : IDL.Null,
    'BadBurn' : IDL.Record({ 'min_burn_amount' : IDL.Nat }),
    'Duplicate' : IDL.Record({ 'duplicate_of' : IDL.Nat }),
    'BadFee' : IDL.Record({ 'expected_fee' : IDL.Nat }),
    'CreatedInFuture' : IDL.Record({ 'ledger_time' : IDL.Nat64 }),
    'TooOld' : IDL.Null,
    'InsufficientFunds' : IDL.Record({ 'balance' : IDL.Nat }),
  });
  const TransferFailReason = IDL.Variant({
    'TransferError' : TransferError_1,
    'CallError' : IDL.Text,
  });
  const SwapError = IDL.Variant({
    'BlockFailed' : BlockFailReason,
    'BurnFailed' : BurnFailReason,
    'UnexpectedError' : ImpossibleErrorReason,
    'TransferFailed' : TransferFailReason,
  });
  const SwapStatus = IDL.Variant({
    'Failed' : SwapError,
    'BurnSuccess' : IDL.Null,
    'Init' : IDL.Null,
    'Complete' : IDL.Null,
    'BlockValid' : IDL.Null,
  });
  const SwapInfo = IDL.Record({
    'status' : SwapStatus,
    'principal' : IDL.Principal,
    'token_swap_block_index' : IDL.Opt(IDL.Nat),
    'burn_block_index' : IDL.Opt(IDL.Nat64),
    'timestamp' : IDL.Nat64,
    'amount' : Tokens,
  });
  const Result = IDL.Variant({ 'Ok' : SwapInfo, 'Err' : IDL.Text });
  const SwapTokensRequest = IDL.Record({
    'block_index' : IDL.Nat64,
    'user' : IDL.Opt(IDL.Principal),
  });
  const SwapTokensResponse = IDL.Variant({
    'Success' : IDL.Null,
    'InternalError' : IDL.Text,
  });
  return IDL.Service({
    'get_swap_info' : IDL.Func([IDL.Nat64], [Result], ['query']),
    'request_deposit_account' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Vec(IDL.Nat8)],
        ['query'],
      ),
    'swap_tokens' : IDL.Func([SwapTokensRequest], [SwapTokensResponse], []),
  });
};
export const init = ({ IDL }) => {
  const InitArgs = IDL.Record({
    'ogy_legacy_minting_account_principal' : IDL.Principal,
    'test_mode' : IDL.Bool,
    'ogy_new_ledger_canister_id' : IDL.Principal,
    'ogy_legacy_ledger_canister_id' : IDL.Principal,
  });
  return [InitArgs];
};
