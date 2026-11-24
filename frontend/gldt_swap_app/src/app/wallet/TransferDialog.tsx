import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { LedgerCanister, TxDuplicateError } from "@dfinity/ledger-icp";
import { IcrcTransferError } from "@dfinity/ledger-icrc";
import { Principal } from "@dfinity/principal";
import { formatUnits, isAddress, type Address, type Hash } from "viem";

import { ICP_LEDGER_CANISTER_ID } from "@constants";
import { CheckCircle, CopySm, NavWallet, XCircle } from "../icons";
import { ICP_TOKENS, ledger } from "../icp/canisters";
import { parseAccountId, parseIcrcAccount, parsePrincipalAndSub, splitAccount, type IcpRecipient } from "../icp/accounts";
import { NETS, txUrl } from "../evm/chains";
import { TxReplaced, confirmed, isUserRejection, sendEvmToken } from "../evm/send";
import { fmt, parseUnits, toNumber } from "../lib/format";
import { useCopy, useIsPhone } from "../lib/ui";
import { Dialog, Pending } from "../shell/Dialog";
import { NET_INFO, SYM_INFO, decimalsOf, priceOf, type WalletData, type WalletToken } from "./model";

type Fungible = Exclude<WalletToken, { kind: "nft" }>;
type Recipient = { kind: "icp"; to: IcpRecipient } | { kind: "evm"; to: Address };
/** Where a confirmed transfer stands. `sent`: an EVM transaction went out but its block was not
 * seen, so it must not be sent again. */
type Status = "idle" | "pending" | "error" | "success" | "sent";

/** The layout classes of the desktop dialog and of the phone board's. */
const DESK = {
  segw: "w-segw", rbox: "w-rcb", rh: "w-rch", qr: "w-qr", rlbl: "w-mt32", rpill: "w-rpill", mt8: "w-mt8", close: "w-mt24",
  ttl: "w-ttl", fcol: "w-fcol", full: "w-full", rrow: "w-rrow", f1: "w-f1", shr: "w-shr", info: "w-info", bal: "w-bpill",
  fee: "w-fee", mt32: "w-mt32", cft: "w-cft", cc: "w-cc", mb8: "w-mb8", dv: "w-dv dashd", mt8b: "c60 t14 w-mt8", tot: "w-tot",
  trw: "w-trw", tre: "w-tre", res: "w-res", resh: "w-resh", mb16: "w-mb16", resb: "w-resb", ml16: "w-ml16",
};
const PHONE: typeof DESK = {
  segw: "wp-swo", rbox: "wp-rbox", rh: "wp-rh t36 f6", qr: "wp-qr", rlbl: "wp-mt16", rpill: "wp-rpill", mt8: "wp-mt8", close: "wp-mt16",
  ttl: "wp-ttl", fcol: "wp-fcol", full: "wp-w100", rrow: "wp-rcol", f1: "wp-f1", shr: "wp-sh0", info: "wp-info", bal: "c60 t14 wp-balp",
  fee: "wp-fee c60 t14", mt32: "wp-mt32", cft: "t36 wp-tc wp-mb32", cc: "wp-ccard", mb8: "wp-mb8", dv: "dashd wp-my16",
  mt8b: "c60 t14 wp-mt8 wp-brk", tot: "wp-tot", trw: "wp-trow t14", tre: "wp-tend", res: "wp-res", resh: "wp-resh t36",
  mb16: "wp-mb16", resb: "wp-resb", ml16: "wp-ml16",
};
type Layout = typeof DESK;

const Copyable = ({ text, head, tail, L }: { text: string; head: number; tail: number; L: Layout }) => {
  const copy = useCopy();
  return (
    <div className={L.rpill}>
      <span className="adr lg tip" data-tip={text}>
        <span className="adri">
          <span className="a1">{text.slice(0, head)}</span>
          <span className="a2">…</span>
          <span className="a3">{text.slice(-tail)}</span>
        </span>
        <button type="button" className="cpb" aria-label="Copy" onClick={() => copy(text)}>
          <CopySm />
        </button>
      </span>
    </div>
  );
};

const Result = ({ ok, onRetry, onClose, L }: { ok: boolean; onRetry: () => void; onClose: () => void; L: Layout }) => (
  <div className={L.res}>
    <div className={L.resh}>
      <div className={L.mb16}>
        <div className="stbox">{ok ? <CheckCircle className="ok" /> : <XCircle className="err" />}</div>
      </div>
      <div>{ok ? "Transfer has been" : "Transfer has"}</div>
      <div className="gold">{ok ? "completed" : "failed"}</div>
    </div>
    {ok ? (
      <div className={L.resb}>
        <button type="button" className="btn" onClick={onClose}>
          Back to wallet
        </button>
      </div>
    ) : (
      <div>
        <button type="button" className="btn ol" onClick={onRetry}>
          Retry
        </button>
        <button type="button" className={`btn ${L.ml16}`} onClick={onClose}>
          Back to wallet
        </button>
      </div>
    )}
  </div>
);

/** Send and Receive for one token: an ICP ledger token or a token on Ethereum or Base. */
export const TransferDialog = ({ t, data, onClose }: { t: Fungible; data: WalletData; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const phone = useIsPhone();
  const L = phone ? PHONE : DESK;
  const [tab, setTab] = useState<"send" | "receive">("send");
  // `createdAt` stamps the ICP transfer, so a Retry of the same confirm is deduplicated by the ledger.
  const [confirm, setConfirm] = useState<{ to: Recipient; send: bigint; createdAt: bigint } | null>(null);
  const [sentHash, setSentHash] = useState<Hash | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<"icrc" | "pa">("icrc");
  const [rcp, setRcp] = useState("");
  const [pr, setPr] = useState("");
  const [sub, setSub] = useState("");
  const [amt, setAmt] = useState("");
  const [rcpTouched, setRcpTouched] = useState(false);
  const [amtTouched, setAmtTouched] = useState(false);

  const icp = t.kind === "icp";
  const sym = icp ? t.sym : t.token.sym;
  const dec = decimalsOf(t);
  const price = priceOf(data.prices, t);
  const b = data.balOf(t);
  const bal = b.kind === "ready" ? b.units : null;
  const fee = icp ? ICP_TOKENS[t.sym].fee : null;
  const isEth = !icp && t.token.sym === "ETH";
  const me = icp ? (data.icp?.kind === "signedIn" ? data.icp.principal.toText() : "") : data.evmAddress ?? "";

  // The recipient, and the message under its field once the user has typed in it.
  const recipient = ((): { ok: Recipient | null; err: string } => {
    if (!icp) {
      const v = rcp.trim();
      if (v === "") return { ok: null, err: rcpTouched ? "Ethereum address is required" : "" };
      const a = /^0x[0-9A-F]{40}$/.test(v) ? v.toLowerCase() : v;
      return isAddress(a)
        ? { ok: { kind: "evm", to: a }, err: "" }
        : { ok: null, err: rcpTouched ? "Invalid Ethereum address" : "" };
    }
    const allowsId = t.sym === "ICP";
    if (mode === "icrc") {
      if (rcp === "")
        return {
          ok: null,
          err: rcpTouched ? (allowsId ? "Principal ID or Account ID or ICRC Account is required" : "Principal ID or ICRC Account is required") : "",
        };
      const r = parseIcrcAccount(rcp) ?? (allowsId ? parseAccountId(rcp) : null);
      return r
        ? { ok: { kind: "icp", to: r }, err: "" }
        : { ok: null, err: rcpTouched ? (allowsId ? "Invalid Principal ID or Account ID or ICRC Account" : "Invalid Principal ID or ICRC Account") : "" };
    }
    if (pr === "") return { ok: null, err: rcpTouched ? "Principal ID is required" : "" };
    const r = parsePrincipalAndSub(pr, sub);
    return r ? { ok: { kind: "icp", to: r }, err: "" } : { ok: null, err: rcpTouched ? "Invalid Principal ID or Subaccount" : "" };
  })();

  // The amount the recipient gets, as app.gold-dao.org computes it: on ICP the typed amount
  // includes the fee unless it is the whole balance.
  const amount = ((): { send: bigint | null; err: string } => {
    if (amt === "") return { send: null, err: "Amount is required" };
    const a = parseUnits(amt, dec);
    if (a === null) return { send: null, err: "" };
    if (fee !== null) {
      if (bal !== null && a + fee > bal) return { send: null, err: "Amount must not exceed your balance minus network fees" };
      if (a <= fee) return { send: null, err: "Amount must not be less or equal than transaction fee" };
      return { send: bal !== null && a + fee === bal ? a : a - fee, err: "" };
    }
    if (a <= 0n) return { send: null, err: "Amount must be greater than 0" };
    if (bal !== null && a > bal) return { send: null, err: "Amount must not exceed your balance" };
    return { send: a, err: "" };
  })();

  const switchTab = (next: "send" | "receive") => {
    if (next === tab) return;
    setTab(next);
    setAmt("");
    setAmtTouched(false);
    setRcpTouched(false);
    if (!recipient.ok) {
      setRcp("");
      setPr("");
      setSub("");
    }
  };

  const toggleMode = () => {
    setRcpTouched(false);
    if (amount.send === null) setAmtTouched(true);
    if (mode === "icrc") {
      const split = recipient.ok?.kind === "icp" ? splitAccount(recipient.ok.to) : { principal: "", sub: "" };
      setMode("pa");
      setPr(split.principal);
      setSub(split.sub);
      setRcp("");
    } else {
      setMode("icrc");
      setRcp(recipient.ok?.kind === "icp" ? recipient.ok.to.text : "");
      setPr("");
      setSub("");
    }
  };

  const refresh = () =>
    queryClient.invalidateQueries({
      predicate: (q) =>
        ["icp-balance", "icp-history", "evm-balances", "evm-history", "explorer-wallet"].includes(String(q.queryKey[0])),
    });

  const run = async (c: { to: Recipient; send: bigint; createdAt: bigint }) => {
    setStatus("pending");
    if (c.to.kind === "evm" && !icp) {
      let hash: Hash;
      try {
        hash = await sendEvmToken(t.token, c.to.to, c.send);
      } catch (e) {
        setStatus(isUserRejection(e) ? "idle" : "error");
        if (!isUserRejection(e)) console.error("Transfer failed", e);
        return;
      }
      setSentHash(hash);
      try {
        await confirmed(t.token.net, hash);
        setStatus("success");
      } catch (e) {
        // Sent: never offer to send it again.
        console.error("Waiting for the transfer failed", e);
        setStatus(e instanceof TxReplaced ? "error" : "sent");
      } finally {
        await refresh();
      }
      return;
    }
    try {
      if (c.to.kind === "icp" && icp) {
        if (data.icp?.kind !== "signedIn") throw new Error("not signed in");
        const to = c.to.to;
        if (to.kind === "accountId") {
          const l = LedgerCanister.create({ agent: data.icp.signer, canisterId: Principal.fromText(ICP_LEDGER_CANISTER_ID) });
          await l.transfer({ to: to.id, amount: c.send, createdAt: c.createdAt });
        } else {
          await ledger(data.icp.signer, t.sym).transfer({
            to: { owner: to.owner, subaccount: to.subaccount ? [to.subaccount] : [] },
            amount: c.send,
            created_at_time: c.createdAt,
          });
        }
      }
      setStatus("success");
    } catch (e) {
      // The ledger already took this exact transfer (a Retry after an unclear failure).
      const duplicate =
        e instanceof TxDuplicateError ||
        (e instanceof IcrcTransferError && typeof e.errorType === "object" && e.errorType !== null && "Duplicate" in e.errorType);
      if (duplicate) setStatus("success");
      else if (isUserRejection(e)) setStatus("idle");
      else {
        console.error("Transfer failed", e);
        setStatus("error");
      }
    } finally {
      await refresh();
    }
  };

  const n = (u: bigint) => toNumber(u, dec);
  const usdOf = (u: bigint) => (price === null ? "" : `≈ $${fmt(n(u) * price)}`);
  const head = icp ? 12 : 6;
  const tail = icp ? 12 : 4;
  const netName = icp ? NET_INFO.icp.name : NETS[t.token.net].name;

  return (
    <Dialog
      label="Transfer"
      title={null}
      size={tab === "send" ? "xxl" : "md"}
      onBack={confirm && status === "idle" ? () => setConfirm(null) : undefined}
      onClose={onClose}
    >
      {!confirm && (
        <div className={L.segw}>
          <div className={L.segw}>
            <div className="seg">
              <button type="button" className={tab === "send" ? "on" : ""} onClick={() => switchTab("send")}>
                Send
              </button>
              <button type="button" className={tab === "receive" ? "on" : ""} onClick={() => switchTab("receive")}>
                Receive
              </button>
            </div>
          </div>
        </div>
      )}
      {tab === "receive" && (
        <>
          <div className={L.rbox}>
            <div className={L.rh}>
              <div>Scan to</div>
              <div className="gold f6">receive</div>
            </div>
            <div className={L.qr}>
              <QRCodeSVG value={me} size={160} role="img" aria-label="QR code of your address" />
            </div>
          </div>
          <div className={L.rlbl}>
            <div>{icp ? "Principal ID" : "Ethereum address"}</div>
            <Copyable text={me} head={head} tail={tail} L={L} />
            {!icp && <div className={`c60 t14 ${L.mt8}`}>Same address on Ethereum and Base.</div>}
          </div>
          <button type="button" className={`btn block ${L.close}`} onClick={onClose}>
            Close
          </button>
        </>
      )}
      {tab === "send" && !confirm && (
        <div>
          <div className={L.ttl}>
            {phone ? (
              <div className="wp-ttc">
                <div className="t36">
                  Send <span className="f6 gold">{sym}</span>
                </div>
                {(sym === "GLDT" || !icp) && <div className="t18 c60">on {netName}</div>}
              </div>
            ) : (
              <div className="t36">
                Send <span className="f6 gold">{sym}</span>
                {(sym === "GLDT" || !icp) && <span className="f4 c60 tnet">on {netName}</span>}
              </div>
            )}
          </div>
          <div className={L.fcol}>
            <div className={L.full}>
              <div className={L.rrow}>
                {mode === "icrc" || !icp ? (
                  <div className={L.full}>
                    <label className="lbl" htmlFor="w-rcp">
                      {!icp ? "Ethereum address" : t.sym === "ICP" ? "Principal ID or Account ID (or ICRC Account)" : "Principal ID (or ICRC account)"}
                    </label>
                    <div className="icard">
                      <input
                        id="w-rcp"
                        className="inp"
                        type="text"
                        autoComplete="off"
                        placeholder={
                          !icp
                            ? "Enter Ethereum address (0x…)"
                            : t.sym === "ICP"
                              ? "Enter Principal ID or Account ID (or ICRC Account)"
                              : "Enter Principal or ICRC Account"
                        }
                        value={rcp}
                        onChange={(e) => {
                          setRcp(e.target.value);
                          setRcpTouched(true);
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className={L.full}>
                    <div>
                      <div className={L.rrow}>
                        <div className={L.f1}>
                          <label className="lbl" htmlFor="w-pr">
                            Principal
                          </label>
                          <div className="icard">
                            <input
                              id="w-pr"
                              className="inp"
                              type="text"
                              autoComplete="off"
                              placeholder="Enter a Principal"
                              value={pr}
                              onChange={(e) => {
                                setPr(e.target.value);
                                setRcpTouched(true);
                              }}
                            />
                          </div>
                        </div>
                        <div className={L.f1}>
                          <label className="lbl" htmlFor="w-sub">
                            Subaccount
                          </label>
                          <div className="icard">
                            <input
                              id="w-sub"
                              className="inp"
                              type="text"
                              autoComplete="off"
                              placeholder="Enter a Subaccount"
                              value={sub}
                              onChange={(e) => setSub(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {icp && (
                  <div className={L.shr}>
                    <button type="button" className="modet" onClick={toggleMode}>
                      {mode === "icrc" ? "Use Principal & Subaccount" : "Use ICRC Account"}
                    </button>
                  </div>
                )}
              </div>
              {recipient.err && <div className="errt">{recipient.err}</div>}
            </div>
            <div>
              <label className="lbl" htmlFor="w-amt">
                Amount
              </label>
              <div className="icard">
                <div className={phone ? "wp-amtrow" : "w-arow"}>
                  <div className={phone ? "wp-amtl" : "w-al"}>
                    <div className={phone ? "wp-lgbox" : "w-lgb"}>
                      <img className={phone ? "wp-i40" : undefined} src={SYM_INFO[sym].img} alt={SYM_INFO[sym].alt} />
                    </div>
                    <input
                      id="w-amt"
                      className="inp"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={`0 ${sym}`}
                      value={amt}
                      onChange={(e) => {
                        setAmt(e.target.value);
                        setAmtTouched(true);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="maxb"
                    disabled={bal === null || isEth || (fee !== null ? bal < fee : bal <= 0n)}
                    onClick={() => {
                      if (bal === null) return;
                      setAmt(formatUnits(fee !== null ? bal - fee : bal, dec));
                      setAmtTouched(true);
                    }}
                  >
                    Max
                  </button>
                </div>
                <div className={phone ? "c40 t14 wp-usdl" : "w-usd"}>
                  {price === null ? "" : "$" + fmt((parseUnits(amt, dec) === null ? 0 : n(parseUnits(amt, dec) ?? 0n)) * price)}
                </div>
              </div>
              <p className="errt">{amtTouched ? amount.err : ""}</p>
            </div>
            <div className={L.info}>
              <div className={L.bal}>
                <div className="balav">
                  <NavWallet width={14} height={14} />
                  <div>{bal === null ? "—" : fmt(n(bal), isEth ? 6 : 5)}</div>
                  <div>{sym}</div>
                </div>
              </div>
              <div className={L.fee}>
                <div className="c40">Fee:</div>
                {fee !== null ? (
                  <>
                    <span>{fmt(n(fee), 8)}</span>
                    <div>{sym}</div>
                    <div className="c40">{price === null ? "" : `≈ $${fmt(n(fee) * price, 8)}`}</div>
                  </>
                ) : (
                  <span>paid in ETH, shown by your wallet</span>
                )}
              </div>
            </div>
          </div>
          <div className={L.mt32}>
            <button
              type="button"
              className="btn block"
              disabled={!recipient.ok || amount.send === null}
              onClick={() => {
                if (recipient.ok && amount.send !== null) {
                  setStatus("idle");
                  setConfirm({ to: recipient.ok, send: amount.send, createdAt: BigInt(Date.now()) * 1_000_000n });
                }
              }}
            >
              Transfer
            </button>
          </div>
        </div>
      )}
      {tab === "send" && confirm && status === "idle" && (
        <div>
          <div className={L.cft}>You are sending</div>
          <div className={L.cc}>
            <div className={L.mb8}>Sending Account</div>
            <div className="c60 t14">{me}</div>
            <div className={L.dv} />
            <div>Receiving Account</div>
            <div className={L.mt8b}>{confirm.to.kind === "icp" ? confirm.to.to.text : confirm.to.to}</div>
            <div className={L.dv} />
            <div className={L.mb8}>Total</div>
            <div className={L.tot}>
              <div className={L.trw}>
                <div className="c60">{fee !== null || isEth ? "Amount deducted (including fee)" : "Amount deducted"}</div>
                <div className={L.tre}>
                  <div>
                    {fmt(n(confirm.send + (fee ?? 0n)), 8)} {sym}
                  </div>
                  <div className="c60">{usdOf(confirm.send + (fee ?? 0n))}</div>
                </div>
              </div>
              <div className={`${L.trw} c60`}>
                <div>Fee</div>
                <div className={L.tre}>
                  {fee !== null ? (
                    <>
                      <div>
                        {fmt(n(fee), 4)} {sym}
                      </div>
                      <div>{usdOf(fee)}</div>
                    </>
                  ) : (
                    <div>paid in ETH</div>
                  )}
                </div>
              </div>
              <div className={L.trw}>
                <div className="c60">Amount received on new wallet</div>
                <div className={L.tre}>
                  <div>
                    {fmt(n(confirm.send), 8)} {sym}
                  </div>
                  <div className="c60">{usdOf(confirm.send)}</div>
                </div>
              </div>
            </div>
          </div>
          <button type="button" className={`btn block ${L.mt32}`} onClick={() => run(confirm)}>
            Confirm Transfer
          </button>
        </div>
      )}
      {tab === "send" && confirm && status === "pending" && <Pending label="Transfer" />}
      {tab === "send" && confirm && (status === "error" || status === "success") && (
        <Result ok={status === "success"} onRetry={() => run(confirm)} onClose={onClose} L={L} />
      )}
      {tab === "send" && confirm && status === "sent" && sentHash && !icp && (
        <div className={L.res}>
          <div className={L.resh}>
            <div className={L.mb16}>
              <div className="stbox">
                <div className="spin" />
              </div>
            </div>
            <div>Transfer has been</div>
            <div className="gold">sent</div>
          </div>
          <div className={`c60 t14 ${L.mb16}`}>
            It is not in a block yet.{" "}
            <a className="gold" href={txUrl(t.token.net, sentHash)} target="_blank" rel="noopener noreferrer">
              Follow it on {NETS[t.token.net].scanName}
            </a>
          </div>
          <div className={L.resb}>
            <button type="button" className="btn" onClick={onClose}>
              Back to wallet
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
};
