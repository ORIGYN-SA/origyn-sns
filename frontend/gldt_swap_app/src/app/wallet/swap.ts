import type { Agent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

import { SWAP_PRINCIPAL, gldtSwap, ledger, nftActor, nftValueE8s, type Collection } from "../icp/canisters";

/** What a GLDT-to-NFT swap takes per NFT besides its value: gldt_swap's fee (0.9 GLDT) and that
 * NFT's share of the ledger fee on the canister's fee transfer, 1 GLDT in all for one NFT and less
 * per NFT for more. */
export const REVERSE_FEE_E8S = 100_000_000n;
/** The GLDT ledger fee the approve itself costs. */
export const LEDGER_FEE_E8S = 10_000_000n;

/** The allowance a GLDT-to-NFT swap of `count` NFTs of `c` needs: their value and 1 GLDT each. */
export const reverseAllowance = (c: Collection, count: number): bigint => BigInt(count) * (nftValueE8s(c) + REVERSE_FEE_E8S);

const variantText = (v: object): string => {
  const [k, x] = Object.entries(v)[0] ?? ["Unknown", ""];
  if (x === null || x === undefined) return k;
  if (typeof x === "object" && !Array.isArray(x)) return `${k}: ${variantText(x)}`;
  return `${k}: ${Array.isArray(x) ? x.map(String).join(" ") : String(x)}`;
};

/** Lets gldt_swap take the user's NFTs of one collection. */
export const approveNfts = async (signer: Agent, c: Collection, ids: bigint[]) => {
  const now = BigInt(Date.now()) * 1_000_000n;
  const res = await nftActor(signer, c).icrc37_approve_tokens(
    ids.map((token_id) => ({
      token_id,
      approval_info: {
        memo: [],
        from_subaccount: [],
        created_at_time: now,
        expires_at: [],
        spender: { owner: SWAP_PRINCIPAL, subaccount: [] },
      },
    }))
  );
  if ("Err" in res) throw new Error(`NFT approve: ${variantText(res.Err)}`);
  for (const r of res.Ok) {
    const [one] = r;
    if (one && "Err" in one) throw new Error(`NFT approve: ${variantText(one.Err)}`);
  }
};

/** Swaps the user's NFTs of one collection for GLDT (after approveNfts). */
export const swapNftsForGldt = async (signer: Agent, c: Collection, ids: bigint[]) => {
  const canister_id = Principal.fromText(c.canister);
  const res = await gldtSwap(signer).swap_nft_for_tokens(ids.map((id) => ({ id, canister_id })));
  if ("Err" in res) throw new Error(`swap_nft_for_tokens: ${variantText(res.Err)}`);
  return res.Ok;
};

/** Lets gldt_swap take what a GLDT-to-NFT swap of `count` NFTs of `c` costs. */
export const approveReverse = async (signer: Agent, c: Collection, count: number) => {
  await ledger(signer, "GLDT").approve({
    spender: { owner: SWAP_PRINCIPAL, subaccount: [] },
    amount: reverseAllowance(c, count),
  });
};

/** Swaps GLDT for the chosen NFTs that gldt_swap holds (after approveReverse). */
export const swapGldtForNfts = async (signer: Agent, c: Collection, ids: bigint[]) => {
  const canister_id = Principal.fromText(c.canister);
  const res = await gldtSwap(signer).swap_tokens_for_nft(ids.map((id) => ({ id, canister_id })));
  if ("Err" in res) throw new Error(`swap_tokens_for_nft: ${variantText(res.Err)}`);
  return res.Ok;
};

/** The NFTs of a collection that gldt_swap can hand out now. */
export const availableNfts = async (anon: Agent, c: Collection): Promise<bigint[]> => {
  const res = await gldtSwap(anon).get_available_nfts_for_canister({
    principal: [],
    canister_id: Principal.fromText(c.canister),
  });
  if ("Err" in res) throw new Error(`get_available_nfts_for_canister: ${variantText(res.Err)}`);
  return res.Ok;
};

