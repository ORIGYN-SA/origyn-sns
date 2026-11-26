import { BaseError, UserRejectedRequestError, erc20Abi, type Address, type Hash, type TransactionReceipt } from "viem";
import { getAccount, sendTransaction, switchChain, waitForTransactionReceipt, writeContract } from "wagmi/actions";

import { wagmiConfig } from "./config";
import { NETS, type EvmNet, type EvmToken } from "./chains";

/** How long the app waits for a sent transaction to land before it shows it as sent, not done. */
const RECEIPT_TIMEOUT_MS = 10 * 60_000;

/** The wallet replaced a sent transaction with another (the user cancelled it), so it never ran. */
export class TxReplaced extends Error {}

/** A sent transaction is in a block but reverted: it did nothing. */
export class TxReverted extends Error {}

/** A sent transaction that is known to have done nothing: replaced, or reverted. Any other error
 * from `confirmed` leaves its outcome open. */
export const txFailed = (e: unknown): boolean => e instanceof TxReplaced || e instanceof TxReverted;

/** Puts the wallet on `net` before anything is signed there; the wallet asks the user if needed. */
export const onNet = async (net: EvmNet) => {
  const chainId = NETS[net].chainId;
  if (getAccount(wagmiConfig).chainId !== chainId) await switchChain(wagmiConfig, { chainId });
  return chainId;
};

/** Waits until the transaction, or the one that sped it up, is in a block and did not revert. A
 * cancelled or replaced transaction throws TxReplaced, a reverted one TxReverted; a wait past the
 * timeout throws. */
export const confirmed = async (net: EvmNet, hash: Hash): Promise<TransactionReceipt> => {
  let replaced = false;
  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    chainId: NETS[net].chainId,
    hash,
    timeout: RECEIPT_TIMEOUT_MS,
    onReplaced: (r) => {
      replaced = r.reason !== "repriced";
    },
  });
  if (replaced) throw new TxReplaced(`transaction ${hash} was replaced`);
  if (receipt.status !== "success") throw new TxReverted(`transaction ${hash} reverted`);
  return receipt;
};

/** Sends `amount` (smallest unit) of a token to `to` from the connected wallet. Resolves once the
 * wallet has sent it; `confirmed` waits for its block. */
export const sendEvmToken = async (token: EvmToken, to: Address, amount: bigint): Promise<Hash> => {
  const chainId = await onNet(token.net);
  return token.address
    ? writeContract(wagmiConfig, {
        chainId,
        address: token.address,
        abi: erc20Abi,
        functionName: "transfer",
        args: [to, amount],
      })
    : sendTransaction(wagmiConfig, { chainId, to, value: amount });
};

/** The user closed or rejected a request in the wallet. Only meaningful before a transaction is
 * sent: afterwards a failed read can look the same. */
export const isUserRejection = (e: unknown): boolean => {
  if (e instanceof BaseError) return e.walk((x) => x instanceof UserRejectedRequestError) instanceof UserRejectedRequestError;
  return e instanceof Error && /user rejected|user denied|rejected the request/i.test(e.message);
};
