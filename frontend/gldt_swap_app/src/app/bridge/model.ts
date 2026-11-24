import icpLogo from "../assets/icp.svg";
import ethLogo from "../assets/eth.png";
import baseLogo from "../assets/base.png";
import { NETS } from "../evm/chains";
import type { Operation, OperationDetails } from "../data/api";
import type { BridgeNet } from "./calls";

export const BRIDGE_NETS: readonly BridgeNet[] = ["icp", "ethereum", "base"];

export const NET = {
  icp: { name: "Internet Computer", logo: icpLogo, alt: "Internet Computer logo", w: "" },
  ethereum: { name: NETS.ethereum.name, logo: ethLogo, alt: "Ethereum logo", w: "" },
  base: { name: NETS.base.name, logo: baseLogo, alt: "Base logo", w: "br-wh" },
} as const satisfies Record<BridgeNet, { name: string; logo: string; alt: string; w: string }>;

/** How long a transfer takes, measured in the live test of the bridge. */
export const arrivalText = (from: BridgeNet, to: BridgeNet): string => {
  if (to === "icp" && from !== "icp")
    return `Arrives after ${NETS[from].confirmations} confirmations, about ${from === "ethereum" ? 6 : 4} minutes`;
  if (from === "ethereum") return "Arrives in about 3 minutes";
  return "Arrives in about 2 minutes";
};

export type StepState = "idle" | "pend" | "ok" | "bad";
export type Step = { label: string; state: StepState };

const apiState = (s: OperationDetails["steps"][number]["state"]): StepState =>
  s === "done" ? "ok" : s === "current" ? "pend" : s === "failed" ? "bad" : "idle";

/** The steps of a transfer as the design names them, from the API's steps once it knows the
 * transfer, or from what the app has done so far. */
export const stepsOf = (
  from: BridgeNet,
  to: BridgeNet,
  local: StepState[],
  op: OperationDetails | null,
  nft = false
): Step[] => {
  const toName = NET[to].name;
  const fromName = NET[from].name;
  if (from === "icp") {
    const labels = [
      "Approve",
      nft || op?.kind === "nft_to_evm" ? "Send the NFTs to the swap" : "Burn on Internet Computer",
      `Claim ready on ${toName}`,
      `Claim on ${toName}`,
    ];
    if (!op) return labels.map((label, i) => ({ label, state: local[i] ?? "idle" }));
    const [burned, signed, claimed] = op.steps;
    return [
      { label: labels[0], state: "ok" },
      { label: labels[1], state: burned ? apiState(burned.state) : "ok" },
      { label: labels[2], state: signed ? apiState(signed.state) : "idle" },
      { label: labels[3], state: claimed?.state === "done" ? "ok" : "idle" },
    ];
  }
  if (to === "icp") {
    const need = NETS[from].confirmations;
    const have = op?.confirmations ?? (op && op.step !== "confirming" ? need : 0);
    const labels = ["Confirm in your wallet", `Burn on ${fromName}`, `${Math.min(have, need)} of ${need} confirmations`, "Mint on Internet Computer"];
    if (!op) return labels.map((label, i) => ({ label, state: local[i] ?? "idle" }));
    const [burned, conf, , minted] = op.steps;
    return [
      { label: labels[0], state: "ok" },
      { label: labels[1], state: burned ? apiState(burned.state) : "ok" },
      { label: labels[2], state: conf ? apiState(conf.state) : "idle" },
      { label: labels[3], state: minted ? apiState(minted.state) : "idle" },
    ];
  }
  const labels = ["Confirm in your wallet", "Send through LayerZero", `Arrive on ${toName}`];
  if (!op) return labels.map((label, i) => ({ label, state: local[i] ?? "idle" }));
  const [sent, delivered] = op.steps;
  return [
    { label: labels[0], state: "ok" },
    { label: labels[1], state: sent ? apiState(sent.state) : "ok" },
    { label: labels[2], state: delivered ? apiState(delivered.state) : "pend" },
  ];
};

/** The status line of a transfer in the list, and its color class. */
export const statusOf = (op: Operation): { text: string; cls: string } => {
  if (op.status === "completed") return { text: "Completed", cls: "ok" };
  if (op.status === "failed") return { text: "Failed", cls: "err" };
  if (op.step === "awaiting_claim") return { text: "Ready to claim", cls: "warn" };
  if (op.kind === "evm_to_icp" && op.step === "confirming" && op.required_confirmations !== null)
    return { text: `${op.confirmations ?? 0} of ${op.required_confirmations} confirmations`, cls: "c60" };
  if (op.status === "needs_attention") return { text: "Delayed", cls: "warn" };
  return { text: "In progress", cls: "c60" };
};
