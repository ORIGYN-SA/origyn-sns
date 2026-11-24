import { erc20Abi, type Address, type Hash } from "viem";
import { getAccount, sendTransaction, switchChain, waitForTransactionReceipt, writeContract } from "wagmi/actions";

import { wagmiConfig } from "./config";
import { NETS, type EvmNet, type EvmToken } from "./chains";

/** Puts the wallet on `net` before anything is signed there; the wallet asks the user if needed. */
export const onNet = async (net: EvmNet) => {
  const chainId = NETS[net].chainId;
  if (getAccount(wagmiConfig).chainId !== chainId) await switchChain(wagmiConfig, { chainId });
  return chainId;
};

/** Waits until the transaction is in a block and did not revert. */
export const confirmed = async (net: EvmNet, hash: Hash) => {
  const receipt = await waitForTransactionReceipt(wagmiConfig, { chainId: NETS[net].chainId, hash });
  if (receipt.status !== "success") throw new Error(`transaction ${hash} reverted`);
  return receipt;
};

/** Sends `amount` (smallest unit) of a token to `to` from the connected wallet. */
export const sendEvmToken = async (token: EvmToken, to: Address, amount: bigint): Promise<Hash> => {
  const chainId = await onNet(token.net);
  const hash = token.address
    ? await writeContract(wagmiConfig, {
        chainId,
        address: token.address,
        abi: erc20Abi,
        functionName: "transfer",
        args: [to, amount],
      })
    : await sendTransaction(wagmiConfig, { chainId, to, value: amount });
  await confirmed(token.net, hash);
  return hash;
};

/** A wallet's refusal: the user closed or rejected the request. Not worth an error screen. */
export const isUserRejection = (e: unknown): boolean =>
  e instanceof Error && /user rejected|user denied|rejected the request|cancel/i.test(e.message);
