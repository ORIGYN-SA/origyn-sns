import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAddress, isHex, type Hex } from "viem";

import type { OperationDetails } from "../data/api";
import type { EvmNet } from "../evm/chains";
import { confirmed, isUserRejection, txFailed } from "../evm/send";
import { useToast } from "../lib/ui";
import { claimFromIcp } from "./calls";
import type { StepState } from "./model";

const asHex = (s: string): Hex => {
  if (!isHex(s)) throw new Error(`not hex: ${s}`);
  return s;
};

/** Submits a transfer's claim voucher on `to` from the connected wallet. `run` is null until the
 * claim starts, then the two steps: confirm in the wallet, and the claim's block. */
export const useClaim = (to: EvmNet, detail: OperationDetails | null) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [run, setRun] = useState<StepState[] | null>(null);

  const claim = async () => {
    const v = detail?.voucher;
    if (!v) return;
    setRun(["pend", "idle"]);
    let hash: Hex;
    try {
      hash = await claimFromIcp(to, {
        icpBurnIndex: BigInt(v.icp_burn_index),
        recipient: getAddress(v.recipient),
        amount: BigInt(v.amount),
        signature: asHex(v.signature),
      });
    } catch (e) {
      if (isUserRejection(e)) {
        setRun(null);
        return;
      }
      console.error("Claim failed", e);
      setRun(["bad", "idle"]);
      return;
    }
    setRun(["ok", "pend"]);
    try {
      await confirmed(to, hash);
      setRun(["ok", "ok"]);
    } catch (e) {
      // The claim was sent: it must not be sent again from here.
      console.error("Waiting for the claim failed", e);
      setRun(["ok", txFailed(e) ? "bad" : "pend"]);
      if (!txFailed(e)) toast("Your claim was sent. It shows as claimed once it is in a block.");
    } finally {
      await queryClient.invalidateQueries({
        predicate: (q) =>
          ["bridge-history", "bridge-op", "evm-balances", "evm-history", "explorer-wallet"].includes(String(q.queryKey[0])),
      });
    }
  };

  return { run, claim, ready: !!detail?.voucher };
};
