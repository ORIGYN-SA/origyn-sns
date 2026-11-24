import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Copy, External } from "../icons";
import { fetchExplorerItem, type Operation, type OperationDetails, type OperationStep } from "../data/api";
import { fmt, utcDate } from "../lib/format";
import { useCopy } from "../lib/ui";
import { Back, Clock, GoArrow, LinkIcon, NoteIcon, StepBad, StepOk } from "./icons";
import { NETS, gldt, hs, look, partOf, pill, sh } from "./present";

const STEP_LABEL: Record<string, (op: Operation) => string> = {
  burned_on_icp: () => "Burned on Internet Computer",
  nfts_received: () => "NFTs received by the swap",
  signed: (op) => `Claim ready on ${NETS[op.to_chain].name}`,
  claimed: (op) => `Claimed on ${NETS[op.to_chain].name}`,
  burned: (op) => (op.kind === "gldt_to_nft" ? `${gldt(op.amount)} burned` : `Burned on ${NETS[op.from_chain].name}`),
  confirmed: (op) => `${op.required_confirmations ?? ""} confirmations`.trim(),
  picked_up: () => "Picked up by the bridge",
  minted: (op) => (op.kind === "nft_to_gldt" ? `${gldt(op.amount)} minted` : "Minted on Internet Computer"),
  sent: () => "Sent through LayerZero",
  delivered: (op) => `Arrived on ${NETS[op.to_chain].name}`,
  nft_received: () => "NFT sent to the swap",
  nft_sent: () => "NFT sent to the wallet",
  completed: () => "Completed",
};

const dur = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.round(s / 3600)} h`;
};

/** One step of a timeline: its state, label, time, and the block or transaction it points at. */
const StepRow = ({ op, s, prev, onOpen }: { op: Operation; s: OperationStep; prev: number | null; onOpen: (id: string) => void }) => {
  const cls = s.state === "done" ? "ok" : s.state === "current" ? "pend" : s.state === "failed" ? "bad" : "idle";
  return (
    <div className={`ex-step ${cls}`}>
      <div className="ex-sd">
        {s.state === "done" && <StepOk />}
        {s.state === "current" && <span className="spin" />}
        {s.state === "failed" && <StepBad />}
      </div>
      <div className="ex-stl">{(STEP_LABEL[s.name] ?? (() => s.name))(op)}</div>
      <div className="ex-str">
        {s.at !== null && (
          <div>
            {new Date(s.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}{" "}
            {prev !== null && s.at > prev && <span className="dim">+{dur(s.at - prev)}</span>}
          </div>
        )}
        {s.block_index !== null && (
          <button type="button" className="ex-lk" onClick={() => onOpen(`icp-${s.block_index}`)}>
            block {fmt(s.block_index ?? 0)}
            <GoArrow />
          </button>
        )}
        {s.block_index === null && s.tx_hash && s.url && (
          <a className="ex-lk" href={s.url} target="_blank" rel="noopener noreferrer">
            {hs(s.tx_hash)}
            <External width={12} height={12} />
          </a>
        )}
      </div>
    </div>
  );
};

type KV = { k: string; v: string; mono?: boolean; copy?: string; href?: string };

const KvRow = ({ r }: { r: KV }) => {
  const copy = useCopy();
  return (
    <div className="ex-ir">
      <div className="ex-ik">{r.k}</div>
      <div className="ex-iv">
        {r.href ? (
          <a className="ex-lk" href={r.href} target="_blank" rel="noopener noreferrer">
            {r.v}
            <External width={12} height={12} />
          </a>
        ) : (
          <span className={r.mono ? "mono" : ""}>{r.v}</span>
        )}
        {r.copy && (
          <button type="button" className="ex-ib" aria-label="Copy" onClick={() => r.copy && copy(r.copy)}>
            <Copy />
          </button>
        )}
      </div>
    </div>
  );
};

const memoText = (hex: string | null): string => {
  if (!hex) return "None";
  const bytes = hex.match(/../g)?.map((b) => parseInt(b, 16)) ?? [];
  const text = new TextDecoder("utf-8", { fatal: false }).decode(Uint8Array.from(bytes));
  return /^[\x20-\x7e]+$/.test(text) ? text : `0x${hex}`;
};

const scanTx = (net: Operation["from_chain"], h: string) => `${net === "base" ? "https://basescan.org" : "https://etherscan.io"}/tx/${h}`;

/** One operation, in place of the list: what moved where, its timeline or details, and its parent. */
export const Detail = ({
  id,
  phone,
  usdOf,
  onBack,
  onOpen,
  onWallet,
}: {
  id: string;
  phone: boolean;
  usdOf: (u: bigint) => string;
  onBack: () => void;
  onOpen: (id: string) => void;
  onWallet: (a: string) => void;
}) => {
  const copy = useCopy();
  const q = useQuery({
    queryKey: ["explorer-item", id],
    queryFn: () => fetchExplorerItem(id),
    retry: false,
    refetchInterval: (x) => (x.state.data?.status === "pending" ? 5_000 : false),
  });
  const parent = useQuery({
    queryKey: ["explorer-item", q.data?.parent_id],
    enabled: !!q.data?.parent_id,
    queryFn: () => fetchExplorerItem(q.data?.parent_id ?? ""),
    retry: false,
  });

  if (q.isLoading) return <div className="ex-ord">Loading...</div>;
  if (!q.data)
    return (
      <div className="ex-ord">
        <div className="ex-oh">
          <button type="button" className="ex-back" onClick={onBack}>
            <Back />
            Back
          </button>
        </div>
        <div className="ex-nf">
          <div className="ex-nft">
            Nothing found for <span className="ex-nfq">{id}</span>
          </div>
        </div>
      </div>
    );

  const op: OperationDetails = q.data;
  const L = look(op, usdOf);
  const p = pill(op);
  const ledgerOrEvm = ["transfer", "approve", "mint", "burn"].includes(op.kind);
  const isIcp = op.from_chain === "icp";
  const first = op.steps[0]?.at ?? op.started_at;
  const done = op.finished_at;
  const head = ledgerOrEvm
    ? isIcp
      ? `Block ${fmt(op.icp_block_index ?? 0)}`
      : `In block ${fmt(op.source_block_number ?? 0)}`
    : op.status === "completed" && done
      ? `Completed in ${dur(done - first)}`
      : op.status === "failed"
        ? op.step === "reimbursed"
          ? "Refunded"
          : "Failed"
        : op.step === "awaiting_claim"
          ? `Ready to claim on ${NETS[op.to_chain].name}`
          : "Updating live";
  const side = (lab: string, a: string | null, net: Operation["from_chain"], avatar: { i: string; ia: string }) => (
    <div className="ex-side" key={lab}>
      <span className="av lg">
        <img src={avatar.i} alt={avatar.ia} />
        <span className="avb">
          <img src={NETS[net].logo} alt={NETS[net].name} />
        </span>
      </span>
      <div className="ex-sdt">
        <div className="ex-sl">{lab}</div>
        <div className="ex-sm mono">{sh(a)}</div>
        <div className="sub">{NETS[net].name}</div>
      </div>
      {a && (
        <div className="ex-acts">
          <button type="button" className="ex-ib" aria-label="Copy" onClick={() => copy(a)}>
            <Copy />
          </button>
          <button type="button" className="ex-mini" onClick={() => onWallet(a)}>
            Transactions
          </button>
        </div>
      )}
    </div>
  );
  const kv: KV[] = ledgerOrEvm
    ? isIcp
      ? [
          { k: "Type", v: L.title },
          { k: "Index", v: fmt(op.icp_block_index ?? 0) },
          ...(op.block_hash ? [{ k: "Hash", v: hs(op.block_hash), mono: true, copy: op.block_hash }] : []),
          { k: "Date", v: utcDate(op.started_at) },
          { k: "Amount", v: gldt(op.amount) },
          { k: "Fee", v: op.fee ? gldt(op.fee) : "None" },
          { k: "Memo", v: memoText(op.memo) },
        ]
      : [
          { k: "Type", v: L.title },
          { k: "Network", v: NETS[op.from_chain].name },
          ...(op.source_block_number ? [{ k: "Block", v: fmt(op.source_block_number) }] : []),
          ...(op.source_tx_hash ? [{ k: "Transaction", v: hs(op.source_tx_hash), href: scanTx(op.from_chain, op.source_tx_hash) }] : []),
          { k: "Date", v: utcDate(op.started_at) },
          { k: "Amount", v: gldt(op.amount) },
          { k: "Gas", v: "Paid in ETH by the sender" },
        ]
    : [];
  const info: KV[] = ledgerOrEvm
    ? []
    : [
        { k: "ID", v: op.id, mono: true, copy: op.id },
        { k: "Kind", v: L.kLab },
        ...(op.from_address ? [{ k: "From wallet", v: sh(op.from_address), mono: true, copy: op.from_address }] : []),
        ...(op.to_address ? [{ k: "To wallet", v: sh(op.to_address), mono: true, copy: op.to_address }] : []),
        ...(op.kind === "gldt_to_nft" && op.fee ? [{ k: "Fee", v: gldt(op.fee) }] : []),
        ...(op.guid ? [{ k: "LayerZero GUID", v: hs(op.guid), mono: true, copy: op.guid }] : []),
        ...(op.layerzero_url ? [{ k: "LayerZero Scan", v: "Track", href: op.layerzero_url }] : []),
        ...(op.required_confirmations ? [{ k: "Confirmations", v: `${op.confirmations ?? op.required_confirmations} of ${op.required_confirmations}` }] : []),
        { k: "Started", v: utcDate(op.started_at) },
        { k: op.status === "failed" ? "Ended" : "Finished", v: done ? utcDate(done) : "Not yet" },
      ];
  const note =
    op.status === "failed"
      ? op.step === "reimbursed"
        ? { cls: "gold", text: "The NFT couldn't be sent, so the GLDT came back to the wallet. Nothing was lost." }
        : op.step === "burn_failed"
          ? { cls: "err", text: "The swap stopped before any GLDT left the wallet." }
          : { cls: "err", text: op.status_detail ?? "This operation failed." }
      : null;
  const parentOp = parent.data;

  return (
    <div className="ex-ord">
      <div className="ex-oh">
        <button type="button" className="ex-back" onClick={onBack}>
          <Back />
          Back
        </button>
        <h2 className="ex-ot">{ledgerOrEvm ? "Transaction" : L.card}</h2>
        <button type="button" className="ex-cl" onClick={() => copy(`${window.location.origin}/explorer?id=${encodeURIComponent(op.id)}`)}>
          <LinkIcon />
          {phone ? "" : "Copy link"}
        </button>
      </div>
      <div className="ex-og">
        <div className="ex-oc">
          <div className="ex-otop">
            <span className={`ex-sp ${p.pc}`}>
              {p.dot && <span className="ping" aria-hidden="true" />}
              {p.pl}
            </span>
            <div className="ex-o2">{head}</div>
          </div>
          {ledgerOrEvm && (
            <div className="ex-big">
              <div className="ex-amt">{gldt(op.amount)}</div>
              <div className="sub">{op.kind === "approve" ? "allowance" : usdOf(op.amount)}</div>
            </div>
          )}
          <div className={`ex-sides ${ledgerOrEvm ? "pair" : "flow"}`}>
            {ledgerOrEvm
              ? [side("From", op.from_address, op.from_chain, L.a), side(op.kind === "approve" ? "Spender" : "To", op.to_address, op.to_chain, L.a)]
              : [side("Sent", op.from_address, op.from_chain, L.a), side(op.status === "completed" ? "Received" : "Receiving", op.to_address, op.to_chain, L.b ?? L.a)]}
          </div>
          {op.step === "awaiting_claim" && (
            <Link className="ex-btn block" to="/bridge">
              Open the app to claim
            </Link>
          )}
        </div>
        <div className="ex-orc">
          <div className="ex-oc">
            <div className="ex-otop">
              <div className="ex-tlh">{ledgerOrEvm ? "Details" : "Timeline"}</div>
              {!ledgerOrEvm && (
                <div className="ex-o2">
                  <Clock />
                  {done ? `${dur(done - first)} total` : "Updating live"}
                </div>
              )}
            </div>
            {!ledgerOrEvm && (
              <div className="ex-steps">
                {op.steps.map((s, i) => (
                  <StepRow key={`${s.name}-${i}`} op={op} s={s} prev={i ? op.steps[i - 1]?.at ?? null : null} onOpen={onOpen} />
                ))}
              </div>
            )}
            {ledgerOrEvm && (
              <div className="ex-kv">
                {kv.map((r) => (
                  <KvRow key={r.k} r={r} />
                ))}
              </div>
            )}
          </div>
          {op.parent_id && (
            <div className="ex-par">
              <span>
                {partOf(op.parent_id)}
                {parentOp ? ` ${look(parentOp, usdOf).card}` : ""}
              </span>
              <button type="button" className="ex-btn sm" onClick={() => op.parent_id && onOpen(op.parent_id)}>
                Open
              </button>
            </div>
          )}
          {note && (
            <div className={`ex-note ${note.cls}`}>
              <NoteIcon />
              <p>{note.text}</p>
            </div>
          )}
        </div>
      </div>
      {info.length > 0 && (
        <div className="ex-oc ex-info">
          {info.map((r) => (
            <KvRow key={r.k} r={r} />
          ))}
        </div>
      )}
    </div>
  );
};
