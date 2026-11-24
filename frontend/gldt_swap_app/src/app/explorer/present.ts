import gldtLogo from "../assets/gldt.svg";
import nftLogo from "../assets/gold-nft.svg";
import icpLogo from "../assets/icp.svg";
import ethLogo from "../assets/eth.png";
import baseLogo from "../assets/base.png";
import { SWAP_CANISTER_ID } from "@constants";
import type { Chain, ListParams, Operation, OperationKind } from "../data/api";
import { fmt, toNumber } from "../lib/format";

export const NETS = {
  icp: { name: "Internet Computer", short: "ICP", logo: icpLogo },
  ethereum: { name: "Ethereum", short: "Ethereum", logo: ethLogo },
  base: { name: "Base", short: "Base", logo: baseLogo },
} as const satisfies Record<Chain, { name: string; short: string; logo: string }>;

/** The kind pills and their type pills, and the feed filter each one sends. */
export type KindKey = "all" | "led" | "brg" | "nft" | "evm";
type Filter = Pick<ListParams, "kind" | "from_chain">;
type Sub = { key: string; label: string; filter: Filter };

const LEDGER: OperationKind[] = ["transfer", "approve", "mint", "burn"];

export const KINDS: { key: KindKey; label: string; filter: Filter; subs: Sub[] }[] = [
  { key: "all", label: "All", filter: {}, subs: [] },
  {
    key: "led",
    label: "ICP ledger",
    filter: { kind: LEDGER, from_chain: ["icp"] },
    subs: [
      { key: "all", label: "All types", filter: { kind: LEDGER, from_chain: ["icp"] } },
      ...LEDGER.map((k) => ({ key: k, label: k[0].toUpperCase() + k.slice(1), filter: { kind: [k], from_chain: ["icp" as const] } })),
    ],
  },
  {
    key: "brg",
    label: "Bridge",
    filter: { kind: ["icp_to_evm", "nft_to_evm", "evm_to_icp", "evm_to_evm"] },
    subs: [
      { key: "all", label: "All routes", filter: { kind: ["icp_to_evm", "nft_to_evm", "evm_to_icp", "evm_to_evm"] } },
      { key: "out", label: "From Internet Computer", filter: { kind: ["icp_to_evm", "nft_to_evm"] } },
      { key: "in", label: "To Internet Computer", filter: { kind: ["evm_to_icp"] } },
      { key: "lz", label: "Between Ethereum and Base", filter: { kind: ["evm_to_evm"] } },
    ],
  },
  {
    key: "nft",
    label: "NFT swaps",
    filter: { kind: ["nft_to_gldt", "gldt_to_nft"] },
    subs: [
      { key: "all", label: "Both ways", filter: { kind: ["nft_to_gldt", "gldt_to_nft"] } },
      { key: "fwd", label: "NFT to GLDT", filter: { kind: ["nft_to_gldt"] } },
      { key: "rev", label: "GLDT to NFT", filter: { kind: ["gldt_to_nft"] } },
    ],
  },
  {
    key: "evm",
    label: "Ethereum and Base",
    filter: { kind: ["transfer", "mint", "burn"], from_chain: ["ethereum", "base"] },
    subs: [
      { key: "all", label: "Both networks", filter: { kind: ["transfer", "mint", "burn"], from_chain: ["ethereum", "base"] } },
      { key: "eth", label: "Ethereum", filter: { kind: ["transfer", "mint", "burn"], from_chain: ["ethereum"] } },
      { key: "base", label: "Base", filter: { kind: ["transfer", "mint", "burn"], from_chain: ["base"] } },
    ],
  },
];

export const filterOf = (kind: KindKey, sub: string): Filter => {
  const k = KINDS.find((x) => x.key === kind) ?? KINDS[0];
  return k.subs.find((s) => s.key === sub)?.filter ?? k.filter;
};

export const ago = (ms: number, now: number): string => {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return `${s} s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
};

/** A wallet as the list shows it: gldt_swap by name, 0x addresses 6 + 4, principals 5 + 3. */
export const sh = (a: string | null): string => {
  if (a === null) return "Minting account";
  if (a === SWAP_CANISTER_ID) return "gldt_swap";
  return a.startsWith("0x") ? `${a.slice(0, 6)}…${a.slice(-4)}` : `${a.slice(0, 5)}…${a.slice(-3)}`;
};

export const hs = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`;

export const gldt = (units: bigint) => `${fmt(toNumber(units, 8))} GLDT`;

type Avatar = { i: string; ia: string; l: string; la: string };
const av = (img: string, alt: string, net: Chain): Avatar => ({ i: img, ia: alt, l: NETS[net].logo, la: NETS[net].name });

/** How a row of the feed looks: its avatars, title, amount, kind badge and transaction cell. */
export type Look = {
  a: Avatar;
  b: Avatar | null;
  title: string;
  sub: string;
  amt: string;
  amtSub: string;
  card: string;
  kImg: string;
  kLab: string;
  tx: string;
};

const nftText = (op: Operation) => {
  const grams = Number(op.amount / 10_000_000_000n);
  return `${grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`} GLD NFT`;
};

export const look = (op: Operation, usd: (u: bigint) => string): Look => {
  const LEDGER_NAMES: Record<string, string> = { transfer: "Transfer", approve: "Approve", mint: "Mint", burn: "Burn" };
  switch (op.kind) {
    case "transfer":
    case "approve":
    case "mint":
    case "burn": {
      if (op.from_chain === "icp") {
        const parent = op.parent_id ? partOf(op.parent_id) : "";
        return {
          a: av(gldtLogo, "GLDT", "icp"),
          b: null,
          title: LEDGER_NAMES[op.kind],
          sub: parent || (op.kind === "approve" ? `Allowance for ${sh(op.to_address)}` : "Internet Computer"),
          amt: gldt(op.amount),
          amtSub: op.kind === "approve" ? "allowance" : usd(op.amount),
          card: `${LEDGER_NAMES[op.kind]} on ICP`,
          kImg: NETS.icp.logo,
          kLab: "Ledger",
          tx: op.icp_block_index === null ? "" : `block ${fmt(op.icp_block_index)}`,
        };
      }
      const net = op.from_chain;
      return {
        a: av(gldtLogo, "GLDT", net),
        b: null,
        title: LEDGER_NAMES[op.kind],
        sub: op.parent_id ? partOf(op.parent_id) : NETS[net].name,
        amt: gldt(op.amount),
        amtSub: usd(op.amount),
        card: `${LEDGER_NAMES[op.kind]} on ${NETS[net].name}`,
        kImg: NETS[net].logo,
        kLab: NETS[net].name,
        tx: op.source_tx_hash ? hs(op.source_tx_hash) : "",
      };
    }
    case "nft_to_gldt":
    case "gldt_to_nft": {
      const fwd = op.kind === "nft_to_gldt";
      const nft = nftText(op);
      const num = op.id.replace(/^swap-(v1-)?/, "");
      return {
        a: fwd ? av(nftLogo, "GLD NFT", "icp") : av(gldtLogo, "GLDT", "icp"),
        b: fwd ? av(gldtLogo, "GLDT", "icp") : av(nftLogo, "GLD NFT", "icp"),
        title: fwd ? "NFT to GLDT" : "GLDT to NFT",
        sub: op.nft_id ? `${nft} #${op.nft_label ?? op.nft_id}` : nft,
        amt: fwd ? gldt(op.amount) : nft,
        amtSub: fwd ? `for a ${nft}` : `for ${gldt(op.amount)}`,
        card: fwd ? `${nft} to GLDT` : `GLDT to ${nft}`,
        kImg: nftLogo,
        kLab: "NFT swap",
        tx: `swap #${num}`,
      };
    }
    case "icp_to_evm":
    case "nft_to_evm":
    case "evm_to_icp":
    case "evm_to_evm": {
      const lz = op.kind === "evm_to_evm";
      const fromNft = op.kind === "nft_to_evm";
      return {
        a: fromNft ? av(nftLogo, "GLD NFT", op.from_chain) : av(gldtLogo, "GLDT", op.from_chain),
        b: av(gldtLogo, "GLDT", op.to_chain),
        title: `${fromNft ? "NFT" : NETS[op.from_chain].short} to ${NETS[op.to_chain].short}`,
        sub: lz ? "LayerZero" : "GLDT Bridge",
        amt: gldt(op.amount),
        amtSub: usd(op.amount),
        card: `${NETS[op.from_chain].short} to ${NETS[op.to_chain].short}`,
        kImg: lz ? "" : gldtLogo,
        kLab: lz ? "LayerZero" : "Bridge",
        tx:
          op.kind === "evm_to_icp" || lz
            ? op.source_tx_hash
              ? hs(op.source_tx_hash)
              : ""
            : op.icp_block_index !== null && op.status !== "failed"
              ? `block ${fmt(op.icp_block_index)}`
              : `transfer #${op.id.replace(/^out-/, "")}`,
      };
    }
    default: {
      const exhaustive: never = op.kind;
      return exhaustive;
    }
  }
};

/** "Part of …" for a leg: its operation by id. */
export const partOf = (parentId: string): string =>
  parentId.startsWith("swap-") ? `Part of NFT swap #${parentId.replace(/^swap-(v1-)?/, "")}` : "Part of bridge transfer";

/** The status pill: a swap that failed after taking GLDT and gave it back reads Refunded. */
export const pill = (op: Operation): { pl: string; pc: string; dot: boolean } => {
  if (op.status === "completed") return { pl: "Completed", pc: "ok", dot: false };
  if (op.step === "awaiting_claim") return { pl: "Ready to claim", pc: "gold", dot: false };
  if (op.step === "quarantined" || op.step === "manual_check") return { pl: "On hold", pc: "hold", dot: false };
  if (op.status === "failed") return op.step === "reimbursed" ? { pl: "Refunded", pc: "gold", dot: false } : { pl: "Failed", pc: "err", dot: false };
  return { pl: "In progress", pc: "prog", dot: true };
};

/** What an operation in progress is waiting for. */
export const stage = (op: Operation): string => {
  if (op.status !== "pending" && op.status !== "needs_attention") return "";
  if (op.kind === "nft_to_gldt") return `Minting ${gldt(op.amount)}`;
  if (op.step === "awaiting_claim") return "Waiting for the claim";
  if (op.step === "confirming" && op.required_confirmations !== null) return `${op.confirmations ?? 0} of ${op.required_confirmations} confirmations`;
  if (op.step === "queued" || op.step === "minting") return "Minting on ICP";
  if (op.kind === "evm_to_evm") return `Arriving on ${NETS[op.to_chain].name}`;
  if (op.status === "needs_attention") return "Held for a manual check";
  return "";
};
