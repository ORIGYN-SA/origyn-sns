
import { CheckCircle, CopySm, XCircle } from "../icons";
import type { Operation } from "../data/api";
import { fmt, toNumber } from "../lib/format";
import { useCopy } from "../lib/ui";
import { Dialog } from "../shell/Dialog";
import { type BridgeNet } from "./calls";
import { useClaim } from "./claim";
import { useBridgeOperation } from "./history";
import { NET, stepsOf, type Step, type StepState } from "./model";

const StepIcon = ({ state }: { state: StepState }) =>
  state === "pend" ? (
    <div className="spin" />
  ) : state === "ok" ? (
    <CheckCircle className="ok" />
  ) : state === "bad" ? (
    <XCircle className="err" />
  ) : (
    <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );

const Steps = ({ title, steps }: { title: string; steps: Step[] }) => (
  <div className="br-dg">
    <div className="br-dc">
      <div className="br-dct">{title}</div>
      <div className="br-sts">
        {steps.map((p) => (
          <div key={p.label} className="br-st">
            <div className="br-stl">
              <div className="stbox">
                <StepIcon state={p.state} />
              </div>
              <div>{p.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const NetLabel = ({ net }: { net: BridgeNet }) => (
  <>
    <span className={`br-lg br-z16 ${NET[net].w}`}>
      <img src={NET[net].logo} alt={NET[net].alt} />
    </span>
    <span>{NET[net].name}</span>
  </>
);

export type ConfirmRow = { l: string; v: string; u: string; lc: string; rc: string };

/** "You are bridging": both accounts and what the transfer costs, before anything is signed. */
export const ConfirmDialog = ({
  from,
  to,
  fromAddr,
  toAddr,
  rows,
  onBack,
  onClose,
  onConfirm,
}: {
  from: BridgeNet;
  to: BridgeNet;
  fromAddr: string;
  toAddr: string;
  rows: ConfirmRow[];
  onBack: () => void;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <Dialog label="Confirm bridge" onBack={onBack} onClose={onClose}>
    <div className="br-yab">You are bridging</div>
    <div className="br-cc">
      <div className="br-mb2">Sending Account</div>
      <div className="br-net t14">
        <NetLabel net={from} />
      </div>
      <div className="c60 t14 br-brk">{fromAddr}</div>
      <div className="dashd br-dv" />
      <div>Receiving Account</div>
      <div className="br-net t14 br-mt2">
        <NetLabel net={to} />
      </div>
      <div className="c60 t14 br-brk">{toAddr}</div>
      <div className="dashd br-dv" />
      <div className="br-mb2">Total</div>
      <div className="br-rows">
        {rows.map((r) => (
          <div key={r.l} className={`br-row ${r.rc}`}>
            <div className={r.lc}>{r.l}</div>
            <div className="br-rv">
              <div>{r.v}</div>
              <div className="c60">{r.u}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <button type="button" className="btn block br-mt8" onClick={onConfirm}>
      Confirm Bridge
    </button>
  </Dialog>
);

/** A transfer's steps, live: what the app has done, then what the bridge reports. */
export const DetailsDialog = ({
  from,
  to,
  opId,
  local,
  nft,
  onClose,
}: {
  from: BridgeNet;
  to: BridgeNet;
  opId: string | null;
  local: StepState[];
  nft: boolean;
  onClose: () => void;
}) => {
  const op = useBridgeOperation(opId).data ?? null;
  return (
    <Dialog label="Bridge details" onClose={onClose}>
      <Steps title={`${NET[from].name} to ${NET[to].name}`} steps={stepsOf(from, to, local, op, nft)} />
      <button type="button" className="btn block" onClick={onClose}>
        Close
      </button>
    </Dialog>
  );
};

/** Claim on Ethereum or Base: submit a transfer's signed voucher from the connected wallet. */
export const ClaimDialog = ({
  op,
  evmConnected,
  price,
  onConnectEvm,
  onClose,
}: {
  op: Operation;
  evmConnected: boolean;
  price: number | null;
  onConnectEvm: () => void;
  onClose: () => void;
}) => {
  const copy = useCopy();
  const detail = useBridgeOperation(op.id).data ?? null;
  const to = op.to_chain === "icp" ? "ethereum" : op.to_chain;
  const recipient = op.to_address ?? "";
  const amount = toNumber(op.amount, 8);
  const { run, claim } = useClaim(to, detail);

  const title = `Claim on ${NET[to].name}`;
  return (
    <Dialog label={title} onClose={onClose}>
      {run === null ? (
        <>
          <div className="br-dg">
            <div className="br-cc">
              <div className="br-rows">
                <div className="br-row">
                  <div className="c60">Amount</div>
                  <div className="br-rv">
                    <div>{fmt(amount)} GLDT</div>
                    <div className="c60">{price === null ? "" : `≈ $${fmt(amount * price)}`}</div>
                  </div>
                </div>
                <div className="br-row">
                  <div className="c60">Network</div>
                  <div className="br-rv">
                    <div className="br-net">
                      <NetLabel net={to} />
                    </div>
                  </div>
                </div>
                <div className="br-row">
                  <div className="c60">Recipient</div>
                  <div className="br-rv">
                    <span className="adr md tip" data-tip={recipient}>
                      <span className="adri">
                        <span className="a1">{recipient.slice(0, 8)}</span>
                        <span className="a2">…</span>
                        <span className="a3">{recipient.slice(-8)}</span>
                      </span>
                      <button type="button" className="cpb" aria-label="Copy address" onClick={() => copy(recipient)}>
                        <CopySm />
                      </button>
                    </span>
                  </div>
                </div>
                <div className="br-row">
                  <div className="c60">Gas</div>
                  <div className="br-rv">
                    <div>Paid in ETH</div>
                    <div className="c60">shown by your wallet</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn block"
            disabled={evmConnected && !detail?.voucher}
            onClick={evmConnected ? () => void claim() : onConnectEvm}
          >
            {!evmConnected ? "Connect Ethereum Wallet" : detail?.voucher ? "Confirm Claim" : "Loading..."}
          </button>
        </>
      ) : (
        <>
          <Steps
            title={`${NET[op.from_chain].name} to ${NET[to].name}`}
            steps={[
              { label: "Confirm in your wallet", state: run[0] ?? "idle" },
              { label: `Claim on ${NET[to].name}`, state: run[1] ?? "idle" },
            ]}
          />
          <button type="button" className="btn block" onClick={onClose}>
            Close
          </button>
        </>
      )}
    </Dialog>
  );
};
