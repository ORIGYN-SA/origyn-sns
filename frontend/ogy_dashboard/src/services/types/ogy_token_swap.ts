import type { Principal } from "@dfinity/principal";
import type { ActorMethod } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";

export interface Account {
  owner: Principal;
  subaccount: [] | [Uint8Array | number[]];
}
export interface Args {
  block_index: bigint;
}
export interface Args_1 {
  of: [] | [Principal];
}
export interface Args_2 {
  block_index: bigint;
  user: [] | [Principal];
}
export type BlockFailReason =
  | {
      ReceiverNotCorrectAccountId: Uint8Array | number[];
    }
  | { NotFound: null }
  | { QueryRequestFailed: null }
  | { SenderNotPrincipalDefaultSubaccount: Uint8Array | number[] }
  | { InvalidOperation: null }
  | { AmountTooSmall: null };
export type BurnFailReason =
  | { TransferError: TransferError }
  | { NoTokensToBurn: null }
  | { CallError: string };
export interface BurnRequestArgs {
  memo: bigint;
  from_subaccount: [] | [Uint8Array | number[]];
  created_at_time: [] | [Timestamp];
  amount: Tokens;
}
export type ImpossibleErrorReason =
  | { AmountNotFound: null }
  | { PrincipalNotFound: null };
export interface InitArgs {
  ogy_legacy_minting_account_principal: Principal;
  test_mode: boolean;
  authorized_principals: Array<Principal>;
  ogy_new_ledger_canister_id: Principal;
  ogy_legacy_ledger_canister_id: Principal;
}
export type Response = { Success: SwapInfo } | { InternalError: string };
export type Response_1 = { Success: Uint8Array | number[] };
export type Response_2 = { Success: bigint } | { InternalError: string };
export type SwapError =
  | { BlockFailed: BlockFailReason }
  | { BurnFailed: BurnFailReason }
  | { UnexpectedError: ImpossibleErrorReason }
  | { TransferFailed: TransferFailReason };
export interface SwapInfo {
  status: SwapStatus;
  last_request: bigint;
  principal: Principal;
  token_swap_block_index: [] | [bigint];
  burn_block_index: [] | [bigint];
  first_request: bigint;
  amount: bigint;
}
export type SwapStatus =
  | { Failed: SwapError }
  | { BurnSuccess: null }
  | { Init: null }
  | { BlockRequest: bigint }
  | { Complete: bigint }
  | { TransferRequest: TransferRequestArgs }
  | { BurnRequest: BurnRequestArgs }
  | { BlockValid: null };
export interface Timestamp {
  timestamp_nanos: bigint;
}
export interface Tokens {
  e8s: bigint;
}
export type TransferError =
  | {
      TxTooOld: { allowed_window_nanos: bigint };
    }
  | { BadFee: { expected_fee: Tokens } }
  | { TxDuplicate: { duplicate_of: bigint } }
  | { TxCreatedInFuture: null }
  | { InsufficientFunds: { balance: Tokens } };
export type TransferError_1 =
  | {
      GenericError: { message: string; error_code: bigint };
    }
  | { TemporarilyUnavailable: null }
  | { BadBurn: { min_burn_amount: bigint } }
  | { Duplicate: { duplicate_of: bigint } }
  | { BadFee: { expected_fee: bigint } }
  | { CreatedInFuture: { ledger_time: bigint } }
  | { TooOld: null }
  | { InsufficientFunds: { balance: bigint } };
export type TransferFailReason =
  | { TransferError: TransferError_1 }
  | { CallError: string };
export interface TransferRequestArgs {
  to: Account;
  memo: [] | [Uint8Array | number[]];
  created_at_time: [] | [bigint];
  amount: bigint;
}
export interface _SERVICE {
  get_swap_info: ActorMethod<[Args], Response>;
  request_deposit_account: ActorMethod<[Args_1], Response_1>;
  swap_tokens: ActorMethod<[Args_2], Response_2>;
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
