import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatUnits, isAddress, type Address, type Hash } from "viem";

import "../styles/bridge.css";
import "../styles/wallet.css";
import gldtLogo from "../assets/gldt.svg";
import { useAuth } from "@auth/index";
import { ArrowDown, Chevron, CopySm, NavBridge } from "../icons";
import type { Operation } from "../data/api";
import type { EvmNet } from "../evm/chains";
import { TxReplaced, confirmed, isUserRejection } from "../evm/send";
import { parseIcrcAccount } from "../icp/accounts";
import { fmt, parseUnits, shortDate, toNumber } from "../lib/format";
import { useCopy, useIsPhone, useToast } from "../lib/ui";
import { useEvmDialog } from "../shell/state";
import { evmToken, useWalletData, type Bal } from "../wallet/model";
import { bridgeToEvm, burnToIcp, sendLayerZero, type BridgeNet } from "./calls";
import { ClaimDialog, ConfirmDialog, DetailsDialog, type ConfirmRow } from "./BridgeDialogs";
import { opIdOfEvmTx, useBridgeHistory } from "./history";
import { BRIDGE_NETS, NET, arrivalText, statusOf, type StepState } from "./model";

const ICP_FEE = 10_000_000n;
const MIN_TO_ICP = 100_000_000n;

type Dlg =
  | { kind: "none" }
  | { kind: "confirm" }
  // `run` is the start() that opened it, or 0 for a transfer of the list.
  | { kind: "details"; run: number; from: BridgeNet; to: BridgeNet; opId: string | null; local: StepState[]; nft: boolean }
  | { kind: "claim"; op: Operation };

const NetPicker = ({
  side,
  value,
  open,
  onToggle,
  onPick,
  balText,
}: {
  side: "From" | "To";
  value: BridgeNet;
  open: boolean;
  onToggle: () => void;
  onPick: (n: BridgeNet) => void;
  balText: (n: BridgeNet) => { sub: string | null; opt: string };
}) => {
  const n = NET[value];
  const sub = balText(value).sub;
  return (
    <div className="br-c3">
      <div className="br-selw">
        <button type="button" className="br-selb" onClick={onToggle} aria-haspopup="listbox" aria-expanded={open} aria-label={`${side} network`}>
          <div className="br-seli">
            <div className="br-sell">
              <span className={`br-lg br-z24 ${n.w}`}>
                <img src={n.logo} alt={n.alt} />
              </span>
              <div className="br-nmw">
                <div className="br-nmt">{n.name}</div>
                {sub && <div className="br-nmb">{sub}</div>}
              </div>
            </div>
            <Chevron className="br-chev" width={18} height={18} />
          </div>
        </button>
        {open && (
          <div className="lbxo br-selo" role="listbox" aria-label={`${side} network`}>
            {BRIDGE_NETS.map((k) => (
              <button key={k} type="button" className="lbxi" role="option" aria-selected={k === value} onClick={() => onPick(k)}>
                <div className="br-opt">
                  <div className="br-optl">
                    <span className={`br-lg br-z40 ${NET[k].w}`}>
                      <img src={NET[k].logo} alt={NET[k].alt} />
                    </span>
                    <div>
                      <div>{NET[k].name}</div>
                      <div className="c60">GLDT</div>
                    </div>
                  </div>
                  <div>{balText(k).opt}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const BridgePage = () => {
  const data = useWalletData();
  const phone = useIsPhone();
  const { login } = useAuth();
  const evmDialog = useEvmDialog();
  const toast = useToast();
  const copy = useCopy();
  const queryClient = useQueryClient();
  const [from, setFrom] = useState<BridgeNet>("icp");
  const [to, setTo] = useState<BridgeNet>("base");
  const [amt, setAmt] = useState("");
  const [rc, setRc] = useState("");
  const [sel, setSel] = useState<"from" | "to" | null>(null);
  const [dlg, setDlg] = useState<Dlg>({ kind: "none" });
  const runs = useRef(0);

  const principal = data.icp?.kind === "signedIn" ? data.icp.principal : null;
  const evm = data.evmAddress ?? null;
  const price = data.prices.GLDT;
  const connected = (k: BridgeNet) => (k === "icp" ? !!principal : !!evm);
  const balOf = (k: BridgeNet): Bal => (k === "icp" ? data.balOf({ kind: "icp", sym: "GLDT" }) : evmGldt(k));
  const evmGldt = (k: EvmNet): Bal => {
    const token = evmToken(k, "GLDT");
    return token ? data.balOf({ kind: "evm", token }) : { kind: "unavailable" };
  };
  const units = (b: Bal) => (b.kind === "ready" ? b.units : null);
  const balText = (k: BridgeNet) => {
    const b = balOf(k);
    if (!connected(k)) return { sub: null, opt: "" };
    if (b.kind === "loading") return { sub: "Fetching your GLDT balance...", opt: "Loading..." };
    if (b.kind === "ready") return { sub: `Balance: ${fmt(toNumber(b.units, 8))} GLDT`, opt: fmt(toNumber(b.units, 8)) };
    return { sub: null, opt: "" };
  };

  const history = useBridgeHistory([principal?.toText(), evm].filter((x): x is string => !!x));
  const ops = history.data?.data ?? [];
  const claims = ops.filter((o) => o.step === "awaiting_claim");

  // A recipient stays when the destination keeps its kind (an ICP account or an EVM address).
  const keepRecipient = (t: BridgeNet) => (t === "icp") === (to === "icp");
  const setNet = (side: "from" | "to", k: BridgeNet) => {
    let f = from;
    let t = to;
    if (side === "from") {
      if (k === t) t = f;
      f = k;
    } else {
      if (k === f) f = t;
      t = k;
    }
    if (!keepRecipient(t)) setRc("");
    setFrom(f);
    setTo(t);
    setSel(null);
  };
  const flip = () => {
    if ((from === "icp") !== (to === "icp")) setRc("");
    setFrom(to);
    setTo(from);
  };

  // The amount, checked against the source balance and the bridge's rules.
  const a = parseUnits(amt, 8);
  const fromBal = units(balOf(from));
  let amtErr = "";
  let amtOk = false;
  if (a !== null && a > 0n && connected(from)) {
    if (from === "icp") {
      if (fromBal !== null && a + ICP_FEE > fromBal) amtErr = "Amount must not exceed your balance minus network fees";
      else if (a < ICP_FEE) amtErr = "Amount must not be less or equal than transaction fee";
      else amtOk = true;
    } else if (fromBal !== null && a > fromBal) amtErr = "Amount must not exceed your balance minus network fees";
    else if (to === "icp" && a < MIN_TO_ICP) amtErr = "Minimum amount to bridge to Internet Computer is 1 GLDT";
    else amtOk = true;
  }

  // The recipient: a principal or account on ICP, an address on Ethereum and Base.
  const rcT = rc.trim();
  const icpTo = to === "icp" ? parseIcrcAccount(rcT) : null;
  // Mixed case must carry a valid EIP-55 checksum, so a typo is caught; all caps reads as lowercase.
  const rcAddr = /^0x[0-9A-F]{40}$/.test(rcT) ? rcT.toLowerCase() : rcT;
  const evmTo: Address | null = to !== "icp" && isAddress(rcAddr) ? rcAddr : null;
  const rOk = to === "icp" ? icpTo !== null : evmTo !== null;
  const rErr = rcT !== "" && !rOk ? (to === "icp" ? "Invalid Principal ID" : "Invalid Ethereum address") : "";

  const mode = from === "icp" ? (principal ? "bridge" : "ic") : evm ? "bridge" : "evm";
  const btn =
    mode === "ic"
      ? { l: "Connect Wallet", a: login, d: false }
      : mode === "evm"
        ? { l: "Connect Ethereum Wallet", a: evmDialog.open, d: false }
        : { l: "Bridge GLDT", a: () => setDlg({ kind: "confirm" }), d: !(amtOk && rOk) };

  const camt = a !== null ? toNumber(a, 8) : 0;
  const usdText = (v: number) => (price === null ? "" : `≈ $${fmt(v * price)}`);
  const pillA = from === "icp" ? "Network fee: 0.1 GLDT" : to === "icp" ? "Network fee: paid in ETH" : "LayerZero fee: paid in ETH";
  const pillB = from === "icp" ? `Then claim on ${NET[to].name}: paid in ETH` : arrivalText(from, to);
  const cfRows: ConfirmRow[] =
    from === "icp"
      ? [
          { l: "Amount deducted (including fee)", v: `${fmt(camt + 0.1, 8)} GLDT`, u: usdText(camt + 0.1), rc: "", lc: "c60" },
          { l: "Fee", v: "0.1 GLDT", u: usdText(0.1), rc: "c60", lc: "" },
          { l: `Amount received on ${NET[to].name}`, v: `${fmt(camt, 8)} GLDT`, u: usdText(camt), rc: "", lc: "c60" },
          { l: `Claim on ${NET[to].name} (paid in ETH)`, v: "Shown by your wallet", u: "", rc: "", lc: "c60" },
        ]
      : [
          { l: "Amount deducted", v: `${fmt(camt, 8)} GLDT`, u: usdText(camt), rc: "", lc: "c60" },
          { l: "Fee", v: to === "icp" ? "Gas, paid in ETH" : "LayerZero fee and gas, paid in ETH", u: "", rc: "c60", lc: "" },
          { l: `Amount received on ${NET[to].name}`, v: `${fmt(camt, 8)} GLDT`, u: usdText(camt), rc: "", lc: "c60" },
        ];

  const refresh = () =>
    queryClient.invalidateQueries({
      predicate: (q) =>
        ["bridge-history", "icp-balance", "icp-history", "evm-balances", "evm-history", "explorer-wallet", "nft-holdings"].includes(
          String(q.queryKey[0])
        ),
    });

  const start = async () => {
    if (a === null) return;
    const f = from;
    const t = to;
    const n = t === "icp" && f !== "icp" ? 4 : f === "icp" ? 4 : 3;
    const run = ++runs.current;
    let sent = false;
    // A step of this transfer updates its details only while they are still on screen: the user
    // may have closed them or opened another transfer's.
    const mine = (d: Dlg) => (d.kind === "details" && d.run === run) || (d.kind === "confirm" && !sent);
    const show = (opId: string | null, l: StepState[]) =>
      setDlg((d) => (mine(d) ? { kind: "details", run, from: f, to: t, opId, local: l, nft: false } : d));
    const clearForm = () => {
      sent = true;
      setAmt("");
      setRc("");
    };
    show(null, Array.from({ length: n }, (_, i) => (i === 0 ? "pend" : "idle")));
    try {
      if (f === "icp") {
        if (data.icp?.kind !== "signedIn" || !evmTo || t === "icp") return;
        const out = await bridgeToEvm(data.icp.signer, t, evmTo, a, () => {
          clearForm();
          show(null, ["ok", "pend", "idle", "idle"]);
        });
        show(`out-${out.id}`, ["ok", "ok", "pend", "idle"]);
      } else {
        let hash: Hash;
        if (t === "icp") {
          if (icpTo?.kind !== "icrc") return;
          hash = await burnToIcp(f, a, icpTo.owner, icpTo.subaccount);
        } else {
          if (!evmTo || !evm) return;
          hash = await sendLayerZero(f, t, evmTo, a, evm);
        }
        clearForm();
        show(null, t === "icp" ? ["ok", "pend", "idle", "idle"] : ["ok", "pend", "idle"]);
        try {
          const receipt = await confirmed(f, hash);
          show(opIdOfEvmTx(f, receipt), t === "icp" ? ["ok", "ok", "pend", "idle"] : ["ok", "ok", "pend"]);
        } catch (e) {
          // The transaction was sent: whatever went wrong while waiting, it must not be sent again.
          console.error("Waiting for the bridge transaction failed", e);
          toast(
            e instanceof TxReplaced
              ? "The transaction was cancelled in your wallet."
              : "Your transaction was sent. It shows in Transactions once it is in a block."
          );
          setDlg((d) => (mine(d) ? { kind: "none" } : d));
        }
      }
    } catch (e) {
      setDlg((d) => (mine(d) ? { kind: "none" } : d));
      if (!sent && isUserRejection(e)) return;
      console.error("Bridge failed", e);
      toast(sent ? "The bridge transfer did not finish. Check Transactions before trying again." : "The bridge transfer did not go through. Nothing was taken.");
    } finally {
      await refresh();
    }
  };

  const tot = BRIDGE_NETS.reduce((s, k) => s + (connected(k) ? toNumber(units(balOf(k)) ?? 0n, 8) : 0), 0);
  const totLoading = BRIDGE_NETS.some((k) => connected(k) && balOf(k).kind === "loading");
  const anyConnected = !!principal || !!evm;

  return (
    <div className="inner">
      <section className="lp" aria-label="Bridge">
        <div className={`br-hd ${phone ? "t36" : "t60"}`}>
          <div className="f6 gold">Bridge</div>
          <div className="f3">across chains</div>
        </div>
        <div className="br-cp">
          Move your GLDT between <span className="f6">Internet Computer, Ethereum and Base</span>. Every GLDT stays backed by physical gold on every network.
        </div>
        {!phone && (
          <>
            <div>
              <div className="tbox">
                <div className="tboxh">Networks</div>
                {anyConnected ? (
                  <div className="tlist">
                    {BRIDGE_NETS.map((k) => {
                      const b = balOf(k);
                      return (
                        <div key={k} className={`tok ${from === k ? "on" : ""}`} onClick={() => setNet("from", k)}>
                          <div className="tokin">
                            <div className="tokl">
                              <span className="glg">
                                <img src={gldtLogo} alt="GLDT logo" />
                                <span className="gnet">
                                  <img src={NET[k].logo} alt={NET[k].alt} />
                                </span>
                              </span>
                              <div className="br-tl">
                                <div>GLDT</div>
                                <div className="c60 t14 f4">{NET[k].name}</div>
                              </div>
                            </div>
                            {!connected(k) ? (
                              <button
                                type="button"
                                className="maxb"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (k === "icp") login();
                                  else evmDialog.open();
                                }}
                              >
                                Connect
                              </button>
                            ) : b.kind === "loading" ? (
                              <div className="tokr">
                                <div>Loading...</div>
                                <div className="c60 t14">
                                  <div>Loading...</div>
                                </div>
                              </div>
                            ) : (
                              <div className="tokr">
                                <div>{b.kind === "ready" ? fmt(toNumber(b.units, 8)) : "—"}</div>
                                <div className="c60 t14">{b.kind === "ready" && price !== null ? "$" + fmt(toNumber(b.units, 8) * price) : ""}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="br-phl" aria-hidden="true">
                    {[0, 1].map((i) => (
                      <div key={i} className="br-phr">
                        <div className="br-phi">
                          <div className="br-phg">
                            <div className="phc br-o40" />
                            <div className="br-phc">
                              <div className="phb br-b20 br-w16" />
                              <div className="phb br-b16 br-w20" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="fade96 fades1" />
                  </div>
                )}
              </div>
            </div>
            {!principal && (
              <div className="lpconn">
                <button type="button" className="btn block" onClick={login}>
                  Connect Wallet
                </button>
              </div>
            )}
          </>
        )}
      </section>
      <section className="rp" aria-label="Bridge GLDT">
        <div>
          <div className="gcard br-hero">
            {!phone && (
              <div className="br-thp">
                <div className="br-thc">
                  <div className="br-thr">
                    <img className="br-z24" src={gldtLogo} alt="GLDT logo" />
                    <div className="f6 t20">GLDT</div>
                  </div>
                  <div className="t14 c60">{price === null ? "" : `1 GLDT ≈ $${fmt(price, 5)}`}</div>
                </div>
              </div>
            )}
            <div className="br-tot">
              <div className="t24 f6">Total GLDT across networks</div>
              <div className="br-tcc">
                <div className={totLoading ? "pulse" : ""}>
                  <div className="br-tcb">
                    <div className="f6">{fmt(tot)}</div>
                    <div className="c60">GLDT</div>
                  </div>
                </div>
                <div className={totLoading ? "pulse" : ""}>
                  <div className="t18">
                    {fmt(tot / 100)} grams of Gold <span className="c60">{price === null ? "" : `($${fmt(tot * price)})`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="br-col">
            {claims.map((c) => (
              <div key={c.id} className="br-okc">
                <div className="br-oki">
                  <div className="br-okt">GLDT ready to claim</div>
                  <div className="br-okr">
                    <div className="br-okl">
                      <div className="t20 f6">
                        Total of: <span>{fmt(toNumber(c.amount, 8))} GLDT</span>
                      </div>
                      <div className="t14 c60">
                        Sent from {NET[c.from_chain].name} to {NET[c.to_chain].name} on{" "}
                        <span className="br-nw">
                          {new Date(c.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <button type="button" className="btnok" onClick={() => setDlg({ kind: "claim", op: c })}>
                      Claim on {NET[c.to_chain].name}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="br-card">
              <div className="br-top">
                <div className="br-ttl">
                  Bridge <span className="gold f6">GLDT</span>
                </div>
                <div className="br-pill">
                  <img src={gldtLogo} alt="GLDT logo" />
                  100 GLDT = 1 gram of physical gold
                </div>
                <div className="br-frm">
                  <div className="br-grid">
                    <div className="br-c4 br-box">
                      <div className="br-boxl">From</div>
                      <div className="br-boxr">
                        {connected(from) && balOf(from).kind === "loading" ? (
                          <div className="br-ld">Loading...</div>
                        ) : (
                          <div className="br-boxi">
                            <div className="br-amf">
                              <input
                                className="br-amt"
                                type="text"
                                inputMode="decimal"
                                autoComplete="off"
                                placeholder="0.00"
                                aria-label="Amount"
                                value={amt}
                                onChange={(e) => {
                                  // A comma is the decimal point, as in 1,5.
                                  let v = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
                                  const i = v.indexOf(".");
                                  if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/[.]/g, "");
                                  setAmt(v);
                                }}
                              />
                              <div>GLDT</div>
                              <div className="br-lgb">
                                <img src={gldtLogo} alt="GLDT logo" />
                              </div>
                            </div>
                            {connected(from) && (
                              <button
                                type="button"
                                className="maxb"
                                disabled={fromBal === null || (from === "icp" ? fromBal < ICP_FEE : fromBal <= 0n)}
                                onClick={() => fromBal !== null && setAmt(formatUnits(from === "icp" ? fromBal - ICP_FEE : fromBal, 8))}
                              >
                                Max
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <NetPicker
                      side="From"
                      value={from}
                      open={sel === "from"}
                      onToggle={() => setSel(sel ? null : "from")}
                      onPick={(k) => setNet("from", k)}
                      balText={balText}
                    />
                  </div>
                  <div className="br-sep">
                    <div className="br-sepi">
                      <div className="br-sepl" />
                      <div className="br-sepb">
                        <button type="button" className="br-flip" onClick={flip} aria-label="Switch From and To">
                          <ArrowDown width={24} height={24} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="br-grid">
                    <div className="br-c4 br-box">
                      <div className="br-boxl">To</div>
                      <div className="br-boxr">
                        <div className="br-boxi">
                          <input
                            className="br-rc"
                            type="text"
                            autoComplete="off"
                            spellCheck={false}
                            placeholder={to === "icp" ? "Enter a Principal ID" : "Enter an Ethereum address"}
                            aria-label="Recipient address"
                            value={rc}
                            onChange={(e) => setRc(e.target.value)}
                          />
                          {connected(to) && (
                            <button type="button" className="maxb" onClick={() => setRc(to === "icp" ? principal?.toText() ?? "" : evm ?? "")}>
                              Mine
                            </button>
                          )}
                          {to !== "icp" && !evm && (
                            <button type="button" className="maxb" onClick={evmDialog.open}>
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <NetPicker
                      side="To"
                      value={to}
                      open={sel === "to"}
                      onToggle={() => setSel(sel ? null : "to")}
                      onPick={(k) => setNet("to", k)}
                      balText={balText}
                    />
                  </div>
                </div>
              </div>
              <div className="gcard br-bot">
                <div className="copper f6">You will receive</div>
                <div className="br-mt4">
                  <div className="br-ra">
                    <div className="br-raw">
                      <span>{fmt(camt)}</span>
                      <span>GLDT</span>
                    </div>
                  </div>
                  <div className="br-rg">
                    {fmt(camt / 100)}g of gold <span className="c60 f4">{price === null ? "" : `($${fmt(camt * price)})`}</span>
                  </div>
                  <div className="br-rate">
                    <div>{pillA}</div>
                    <div>{pillB}</div>
                  </div>
                </div>
                <div className="br-bw">
                  <button type="button" className="btn lg block" onClick={btn.a} disabled={btn.d}>
                    {btn.l}
                  </button>
                  {mode === "bridge" && amtErr && <div className="br-err">{amtErr}</div>}
                  {mode === "bridge" && rErr && <div className="br-err">{rErr}</div>}
                </div>
              </div>
            </div>
            <div>
              <div className="br-mb4">Transactions</div>
              {!anyConnected ? (
                <div className="br-txp" aria-hidden="true">
                  {[0, 1].map((i) => (
                    <div key={i} className="br-txpr">
                      <div className="br-phi">
                        <div className="br-phg">
                          <div className="phc br-o20" />
                          <div className="phb br-b20 br-w20" />
                        </div>
                        <div className="phb br-b20 br-w20" />
                      </div>
                    </div>
                  ))}
                  <div className="fade96 fadebg" />
                </div>
              ) : history.isLoading ? (
                <div>Loading...</div>
              ) : (
                <>
                  <div className="br-list">
                    {ops.map((t) => {
                      const st = statusOf(t);
                      const fa = t.from_address ?? "";
                      const ta = t.to_address ?? "";
                      const cp = t.to_chain === "icp" ? fa : ta;
                      const open = () =>
                        t.step === "awaiting_claim"
                          ? setDlg({ kind: "claim", op: t })
                          : setDlg({ kind: "details", run: 0, from: t.from_chain, to: t.to_chain, opId: t.id, local: [], nft: t.kind === "nft_to_evm" });
                      const usd = price === null ? "" : "$" + fmt(toNumber(t.amount, 8) * price);
                      const icon = (
                        <div className="kic">
                          <NavBridge width={20} height={20} />
                        </div>
                      );
                      return phone ? (
                        <div key={t.id} className="txm br-tx" onClick={open}>
                          <div className="txg">
                            {icon}
                            <div className="txb">
                              <div className="txk">Bridge</div>
                              <div className="br-ml1 txs">
                                <span className={`br-lg br-z16 ${NET[t.from_chain].w}`}>
                                  <img src={NET[t.from_chain].logo} alt={NET[t.from_chain].alt} />
                                </span>
                                <div className="br-arr">
                                  <ArrowDown className="rotm90" width={12} height={12} />
                                </div>
                                <span className={`br-lg br-z16 ${NET[t.to_chain].w}`}>
                                  <img src={NET[t.to_chain].logo} alt={NET[t.to_chain].alt} />
                                </span>
                                <span className="adr">
                                  <span className="adri">
                                    <span className="a1">{cp.slice(0, 4)}</span>
                                    <span className="a2">…</span>
                                    <span className="a3">{cp.slice(-4)}</span>
                                  </span>
                                </span>
                              </div>
                              <div className="txs">
                                <span className="txd">{shortDate(t.started_at)}</span>
                                <span>·</span>
                                <span className={`f6 ${st.cls}`}>{st.text}</span>
                              </div>
                            </div>
                          </div>
                          <div className="txv">
                            <div className="txa">{fmt(toNumber(t.amount, 8))} GLDT</div>
                            <div className="txu">{usd}</div>
                          </div>
                        </div>
                      ) : (
                        <div key={t.id} className="txr br-tx" onClick={open}>
                          <div className="txg br-txk">
                            {icon}
                            <div className="txb">
                              <div className="txk">Bridge</div>
                              <div className="txs">
                                <span className="txd">{shortDate(t.started_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="t14 br-txi br-txm">
                            <div className="br-l1">
                              {[
                                { net: t.from_chain, a: fa },
                                { net: t.to_chain, a: ta },
                              ].map((x, i) => (
                                <div key={i} style={{ display: "contents" }}>
                                  {i === 1 && (
                                    <div className="br-arr">
                                      <ArrowDown className="rotm90" width={12} height={12} />
                                    </div>
                                  )}
                                  <div className="br-na">
                                    <span className={`br-lg br-z16 ${NET[x.net].w}`}>
                                      <img src={NET[x.net].logo} alt={NET[x.net].alt} />
                                    </span>
                                    <span className="adr lg tip br-mw0" data-tip={x.a}>
                                      <span className="adri">
                                        <span className="a1">{x.a.slice(0, 12)}</span>
                                        <span className="a2">…</span>
                                        <span className="a3">{x.a.slice(-12)}</span>
                                      </span>
                                      <button
                                        type="button"
                                        className="cpb"
                                        aria-label="Copy address"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copy(x.a);
                                        }}
                                      >
                                        <CopySm />
                                      </button>
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="br-l2">
                              <span className={`f6 ${st.cls}`}>{st.text}</span>
                            </div>
                          </div>
                          <div className="txv">
                            <div className="txa">{fmt(toNumber(t.amount, 8))} GLDT</div>
                            <div className="txu">{usd}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="br-foot">{ops.length ? "No more transactions found" : "No transactions found"}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      {dlg.kind === "confirm" && (
        <ConfirmDialog
          from={from}
          to={to}
          fromAddr={from === "icp" ? principal?.toText() ?? "" : evm ?? ""}
          toAddr={rcT}
          rows={cfRows}
          onBack={() => setDlg({ kind: "none" })}
          onClose={() => setDlg({ kind: "none" })}
          onConfirm={() => void start()}
        />
      )}
      {dlg.kind === "details" && (
        <DetailsDialog from={dlg.from} to={dlg.to} opId={dlg.opId} local={dlg.local} nft={dlg.nft} onClose={() => setDlg({ kind: "none" })} />
      )}
      {dlg.kind === "claim" && (
        <ClaimDialog op={dlg.op} evmConnected={!!evm} price={price} onConnectEvm={evmDialog.open} onClose={() => setDlg({ kind: "none" })} />
      )}
    </div>
  );
};

export default BridgePage;
