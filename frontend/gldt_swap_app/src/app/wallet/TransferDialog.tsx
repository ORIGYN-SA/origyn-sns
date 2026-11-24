import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { LedgerCanister } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import { isAddress, type Address } from "viem";

import { ICP_LEDGER_CANISTER_ID } from "@constants";
import { CheckCircle, CopySm, NavWallet, XCircle } from "../icons";
import { ICP_TOKENS, ledger } from "../icp/canisters";
import { parseAccountId, parseIcrcAccount, parsePrincipalAndSub, splitAccount, type IcpRecipient } from "../icp/accounts";
import { NETS } from "../evm/chains";
import { isUserRejection, sendEvmToken } from "../evm/send";
import { fmt, parseUnits, toNumber } from "../lib/format";
import { useCopy } from "../lib/ui";
import { Dialog, Pending } from "../shell/Dialog";
import { NET_INFO, SYM_INFO, decimalsOf, priceOf, type WalletData, type WalletToken } from "./model";

type Fungible = Exclude<WalletToken, { kind: "nft" }>;
type Recipient = { kind: "icp"; to: IcpRecipient } | { kind: "evm"; to: Address };
type Status = "idle" | "pending" | "error" | "success";

const Copyable = ({ text, head, tail }: { text: string; head: number; tail: number }) => {
  const copy = useCopy();
  return (
    <div className="w-rpill">
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

const Result = ({ ok, onRetry, onClose }: { ok: boolean; onRetry: () => void; onClose: () => void }) => (
  <div className="w-res">
    <div className="w-resh">
      <div className="w-mb16">
        <div className="stbox">{ok ? <CheckCircle className="ok" /> : <XCircle className="err" />}</div>
      </div>
      <div>{ok ? "Transfer has been" : "Transfer has"}</div>
      <div className="gold">{ok ? "completed" : "failed"}</div>
    </div>
    {ok ? (
      <div className="w-resb">
        <button type="button" className="btn" onClick={onClose}>
          Back to wallet
        </button>
      </div>
    ) : (
      <div>
        <button type="button" className="btn ol" onClick={onRetry}>
          Retry
        </button>
        <button type="button" className="btn w-ml16" onClick={onClose}>
          Back to wallet
        </button>
      </div>
    )}
  </div>
);

/** Send and Receive for one token: an ICP ledger token or a token on Ethereum or Base. */
export const TransferDialog = ({ t, data, onClose }: { t: Fungible; data: WalletData; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"send" | "receive">("send");
  const [confirm, setConfirm] = useState<{ to: Recipient; send: bigint } | null>(null);
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
      return isAddress(v, { strict: false })
        ? { ok: { kind: "evm", to: v }, err: "" }
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

  const run = async (c: { to: Recipient; send: bigint }) => {
    setStatus("pending");
    try {
      if (c.to.kind === "icp" && icp) {
        if (data.icp?.kind !== "signedIn") throw new Error("not signed in");
        const to = c.to.to;
        if (to.kind === "accountId") {
          const l = LedgerCanister.create({ agent: data.icp.signer, canisterId: Principal.fromText(ICP_LEDGER_CANISTER_ID) });
          await l.transfer({ to: to.id, amount: c.send });
        } else {
          await ledger(data.icp.signer, t.sym).transfer({
            to: { owner: to.owner, subaccount: to.subaccount ? [to.subaccount] : [] },
            amount: c.send,
          });
        }
      } else if (c.to.kind === "evm" && !icp) {
        await sendEvmToken(t.token, c.to.to, c.send);
      }
      setStatus("success");
      await queryClient.invalidateQueries({
        predicate: (q) => ["icp-balance", "icp-history", "evm-balances", "evm-history"].includes(String(q.queryKey[0])),
      });
    } catch (e) {
      if (isUserRejection(e)) {
        setStatus("idle");
        return;
      }
      console.error("Transfer failed", e);
      setStatus("error");
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
        <div className="w-segw">
          <div className="w-segw">
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
          <div className="w-rcb">
            <div className="w-rch">
              <div>Scan to</div>
              <div className="gold f6">receive</div>
            </div>
            <div className="w-qr">
              <QRCodeSVG value={me} size={160} role="img" aria-label="QR code of your address" />
            </div>
          </div>
          <div className="w-mt32">
            <div>{icp ? "Principal ID" : "Ethereum address"}</div>
            <Copyable text={me} head={head} tail={tail} />
            {!icp && <div className="c60 t14 w-mt8">Same address on Ethereum and Base.</div>}
          </div>
          <button type="button" className="btn block w-mt24" onClick={onClose}>
            Close
          </button>
        </>
      )}
      {tab === "send" && !confirm && (
        <div>
          <div className="w-ttl">
            <div className="t36">
              Send <span className="f6 gold">{sym}</span>
              {(sym === "GLDT" || !icp) && <span className="f4 c60 tnet">on {netName}</span>}
            </div>
          </div>
          <div className="w-fcol">
            <div className="w-full">
              <div className="w-rrow">
                {mode === "icrc" || !icp ? (
                  <div className="w-full">
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
                  <div className="w-full">
                    <div>
                      <div className="w-rrow">
                        <div className="w-f1">
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
                        <div className="w-f1">
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
                  <div className="w-shr">
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
                <div className="w-arow">
                  <div className="w-al">
                    <div className="w-lgb">
                      <img src={SYM_INFO[sym].img} alt={SYM_INFO[sym].alt} />
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
                      setAmt(String(n(fee !== null ? bal - fee : bal)));
                      setAmtTouched(true);
                    }}
                  >
                    Max
                  </button>
                </div>
                <div className="w-usd">
                  {price === null ? "" : "$" + fmt((parseUnits(amt, dec) === null ? 0 : n(parseUnits(amt, dec) ?? 0n)) * price)}
                </div>
              </div>
              <p className="errt">{amtTouched ? amount.err : ""}</p>
            </div>
            <div className="w-info">
              <div className="w-bpill">
                <div className="balav">
                  <NavWallet width={14} height={14} />
                  <div>{bal === null ? "—" : fmt(n(bal), isEth ? 6 : 5)}</div>
                  <div>{sym}</div>
                </div>
              </div>
              <div className="w-fee">
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
          <div className="w-mt32">
            <button
              type="button"
              className="btn block"
              disabled={!recipient.ok || amount.send === null}
              onClick={() => {
                if (recipient.ok && amount.send !== null) {
                  setStatus("idle");
                  setConfirm({ to: recipient.ok, send: amount.send });
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
          <div className="w-cft">You are sending</div>
          <div className="w-cc">
            <div className="w-mb8">Sending Account</div>
            <div className="c60 t14">{me}</div>
            <div className="w-dv dashd" />
            <div>Receiving Account</div>
            <div className="c60 t14 w-mt8">{confirm.to.kind === "icp" ? confirm.to.to.text : confirm.to.to}</div>
            <div className="w-dv dashd" />
            <div className="w-mb8">Total</div>
            <div className="w-tot">
              <div className="w-trw">
                <div className="c60">{fee !== null || isEth ? "Amount deducted (including fee)" : "Amount deducted"}</div>
                <div className="w-tre">
                  <div>
                    {fmt(n(confirm.send + (fee ?? 0n)), 8)} {sym}
                  </div>
                  <div className="c60">{usdOf(confirm.send + (fee ?? 0n))}</div>
                </div>
              </div>
              <div className="w-trw c60">
                <div>Fee</div>
                <div className="w-tre">
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
              <div className="w-trw">
                <div className="c60">Amount received on new wallet</div>
                <div className="w-tre">
                  <div>
                    {fmt(n(confirm.send), 8)} {sym}
                  </div>
                  <div className="c60">{usdOf(confirm.send)}</div>
                </div>
              </div>
            </div>
          </div>
          <button type="button" className="btn block w-mt32" onClick={() => run(confirm)}>
            Confirm Transfer
          </button>
        </div>
      )}
      {tab === "send" && confirm && status === "pending" && <Pending label="Transfer" />}
      {tab === "send" && confirm && (status === "error" || status === "success") && (
        <Result ok={status === "success"} onRetry={() => run(confirm)} onClose={onClose} />
      )}
    </Dialog>
  );
};
