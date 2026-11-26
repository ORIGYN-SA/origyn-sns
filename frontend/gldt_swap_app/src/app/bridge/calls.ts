import type { Agent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { bytesToHex, getAddress, pad, type Address, type Hash, type Hex } from "viem";
import { readContract, writeContract } from "wagmi/actions";

import { gldtBridgeAbi } from "../evm/abi";
import { GLDT_TOKEN, NETS, type EvmNet } from "../evm/chains";
import { wagmiConfig } from "../evm/config";
import { onNet } from "../evm/send";
import { COLLECTIONS, SWAP_PRINCIPAL, gldtSwap, ledger } from "../icp/canisters";
import type { Selection } from "../wallet/Picker";

/** Where the bridge moves GLDT: the Internet Computer or one of the EVM networks. */
export type BridgeNet = "icp" | EvmNet;

const variantText = (v: object): string => {
  const [k, x] = Object.entries(v)[0] ?? ["Unknown", ""];
  if (x === null || x === undefined) return k;
  if (typeof x === "object") return `${k}: ${JSON.stringify(x, (_, y) => (typeof y === "bigint" ? y.toString() : y))}`;
  return `${k}: ${String(x)}`;
};

/** ICP to Ethereum or Base: approve gldt_swap for the amount, then burn it and get a voucher. */
export const bridgeToEvm = async (signer: Agent, to: EvmNet, recipient: Address, amount: bigint, onApproved: () => void) => {
  await ledger(signer, "GLDT").approve({ spender: { owner: SWAP_PRINCIPAL, subaccount: [] }, amount });
  onApproved();
  const res = await gldtSwap(signer).bridge_to_evm({
    chain: to === "ethereum" ? { Ethereum: null } : { Base: null },
    recipient: getAddress(recipient),
    from_subaccount: [],
    amount,
  });
  if ("Err" in res) throw new Error(`bridge_to_evm: ${variantText(res.Err)}`);
  return res.Ok;
};

/** GLD NFTs to GLDT on Ethereum or Base: gldt_swap takes the NFTs, which the caller approved for
 * it, and signs a claim voucher for their GLDT value. No fee; nothing is minted or burned on ICP.
 * One call may mix collections, up to 100 NFTs. */
export const swapNftsForEvm = async (signer: Agent, to: EvmNet, recipient: Address, nfts: Selection) => {
  const chosen = COLLECTIONS.filter((c) => nfts[c.key].length > 0);
  const res = await gldtSwap(signer).swap_nft_for_evm({
    chain: to === "ethereum" ? { Ethereum: null } : { Base: null },
    recipient: getAddress(recipient),
    nfts: chosen.flatMap((c) => nfts[c.key].map((id) => ({ id, canister_id: Principal.fromText(c.canister) }))),
  });
  if ("Err" in res) throw new Error(`swap_nft_for_evm: ${variantText(res.Err)}`);
  return res.Ok.transfer;
};

/** The ICP principal as burnToIcp takes it: its length, its bytes, then zeros. */
export const principalWord = (p: Principal): Hex => {
  const b = p.toUint8Array();
  const word = new Uint8Array(32);
  word[0] = b.length;
  word.set(b, 1);
  return bytesToHex(word);
};

/** A 32-byte subaccount, or zero for the default account. */
export const subaccountWord = (sub: Uint8Array | undefined): Hex => (sub ? bytesToHex(sub) : pad("0x00", { size: 32 }));

/** Ethereum or Base to ICP: burn GLDT on the token; gldt_swap mints it on ICP once confirmed.
 * Resolves once the wallet has sent the transaction; `confirmed` waits for its block. */
export const burnToIcp = async (from: EvmNet, amount: bigint, owner: Principal, sub: Uint8Array | undefined): Promise<Hash> => {
  const chainId = await onNet(from);
  const hash = await writeContract(wagmiConfig, {
    chainId,
    address: GLDT_TOKEN,
    abi: gldtBridgeAbi,
    functionName: "burnToIcp",
    args: [amount, principalWord(owner), subaccountWord(sub)],
  });
  return hash;
};

/** Submits a signed voucher on its chain, minting the GLDT to the voucher's recipient. Anyone may
 * submit it; the connected wallet pays the gas. Resolves once the wallet has sent it. */
export const claimFromIcp = async (
  net: EvmNet,
  v: { icpBurnIndex: bigint; recipient: Address; amount: bigint; signature: Hex }
): Promise<Hash> => {
  const chainId = await onNet(net);
  const hash = await writeContract(wagmiConfig, {
    chainId,
    address: GLDT_TOKEN,
    abi: gldtBridgeAbi,
    functionName: "claimFromIcp",
    args: [v.icpBurnIndex, v.recipient, v.amount, v.signature],
  });
  return hash;
};

const sendParam = (to: EvmNet, recipient: Address, amount: bigint) =>
  ({
    dstEid: NETS[to].lzEid,
    to: pad(recipient, { size: 32 }),
    amountLD: amount,
    minAmountLD: amount,
    extraOptions: "0x",
    composeMsg: "0x",
    oftCmd: "0x",
  }) as const;

/** The LayerZero fee, in wei of the source chain, of sending `amount` to `to`. Read through the
 * connected wallet, which is put on the source chain first. */
export const quoteLayerZero = async (from: EvmNet, to: EvmNet, recipient: Address, amount: bigint) => {
  const chainId = await onNet(from);
  const fee = await readContract(wagmiConfig, {
    chainId,
    address: GLDT_TOKEN,
    abi: gldtBridgeAbi,
    functionName: "quoteSend",
    args: [sendParam(to, recipient, amount), false],
  });
  return fee.nativeFee;
};

/** Ethereum to Base or back over LayerZero: the native fee is paid with the transaction.
 * Resolves once the wallet has sent it. */
export const sendLayerZero = async (from: EvmNet, to: EvmNet, recipient: Address, amount: bigint, refund: Address): Promise<Hash> => {
  const chainId = await onNet(from);
  const nativeFee = await quoteLayerZero(from, to, recipient, amount);
  const hash = await writeContract(wagmiConfig, {
    chainId,
    address: GLDT_TOKEN,
    abi: gldtBridgeAbi,
    functionName: "send",
    args: [sendParam(to, recipient, amount), { nativeFee, lzTokenFee: 0n }, refund],
    value: nativeFee,
  });
  return hash;
};

