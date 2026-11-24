import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

import { CheckCircle, CopySm, XCircle } from "../icons";
import { COLLECTIONS, nftActor, type Collection, type CollectionKey } from "../icp/canisters";
import { parseIcrcAccount } from "../icp/accounts";
import { useCopy } from "../lib/ui";
import { Dialog } from "../shell/Dialog";
import type { WalletData } from "./model";
import { Picker, type Selection } from "./Picker";
import { nftName } from "./rows";
import { NONE } from "./selection";

type Job = { c: Collection; id: bigint; st: "pend" | "ok" | "bad" };

const sendNfts = async (data: WalletData, c: Collection, ids: bigint[], to: NonNullable<ReturnType<typeof parseIcrcAccount>>) => {
  if (data.icp?.kind !== "signedIn" || to.kind !== "icrc") throw new Error("not signed in");
  const res = await nftActor(data.icp.signer, c).icrc7_transfer(
    ids.map((token_id) => ({
      token_id,
      to: { owner: to.owner, subaccount: to.subaccount ? [to.subaccount] : [] },
      memo: [],
      from_subaccount: [],
      created_at_time: [],
    }))
  );
  return ids.map((id, i) => {
    const [r] = res[i] ?? [];
    return { id, ok: !!r && "Ok" in r };
  });
};

/** Send GLD NFTs to a principal or account, or show the address to receive them. */
export const NftTransferDialog = ({ data, onClose }: { data: WalletData; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const copy = useCopy();
  const [tab, setTab] = useState<"send" | "receive">("send");
  const [step, setStep] = useState<"select" | "confirm" | "details">("select");
  const [sel, setSel] = useState<Selection>(NONE);
  const [rcp, setRcp] = useState("");
  const [touched, setTouched] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const me = data.icp?.kind === "signedIn" ? data.icp.principal.toText() : "";

  const to = parseIcrcAccount(rcp);
  const err = rcp === "" ? "Recipient address is required" : to ? "" : "Invalid recipient address";
  const chosen = COLLECTIONS.filter((c) => sel[c.key].length > 0);
  const n = chosen.reduce((a, c) => a + sel[c.key].length, 0);
  const grams = chosen.reduce((a, c) => a + sel[c.key].length * c.grams, 0);

  const run = async (list: Job[]) => {
    if (!to) return;
    const mark = (key: CollectionKey, id: bigint, st: Job["st"]) =>
      setJobs((js) => js.map((j) => (j.c.key === key && j.id === id ? { ...j, st } : j)));
    await Promise.all(
      COLLECTIONS.map(async (c) => {
        const ids = list.filter((j) => j.c.key === c.key).map((j) => j.id);
        if (!ids.length) return;
        ids.forEach((id) => mark(c.key, id, "pend"));
        try {
          (await sendNfts(data, c, ids, to)).forEach((r) => mark(c.key, r.id, r.ok ? "ok" : "bad"));
        } catch (e) {
          console.error("NFT transfer failed", e);
          ids.forEach((id) => mark(c.key, id, "bad"));
        }
      })
    );
    await queryClient.invalidateQueries({
      predicate: (q) => ["nft-holdings", "nft-history"].includes(String(q.queryKey[0])),
    });
  };

  const confirm = () => {
    const list: Job[] = chosen.flatMap((c) => sel[c.key].map((id) => ({ c, id, st: "pend" as const })));
    setJobs(list);
    setSel(NONE);
    setStep("details");
    void run(list);
  };

  if (step === "details") {
    return (
      <Dialog label="Send NFT details" onClose={onClose}>
        <div className="w-dgrid">
          {COLLECTIONS.filter((c) => jobs.some((j) => j.c.key === c.key)).map((c) => (
            <div key={c.key} className="w-dcol">
              <div className="w-dct">{c.label} collection</div>
              <div className="w-drs">
                {jobs
                  .filter((j) => j.c.key === c.key)
                  .map((j) => (
                    <div key={String(j.id)} className="w-dr">
                      <div className="w-arow">
                        <div className="w-drl">
                          <div>
                            <div className="stbox">
                              {j.st === "pend" ? <div className="spin" /> : j.st === "ok" ? <CheckCircle className="ok" /> : <XCircle className="err" />}
                            </div>
                          </div>
                          <div>
                            {j.st === "ok" ? "Transfer " : "Transferring "}
                            {nftName(c, j.id)}
                          </div>
                        </div>
                        {j.st === "bad" && (
                          <div>
                            <button type="button" className="btn sm" onClick={() => void run([j])}>
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="btn block" onClick={onClose}>
          Close
        </button>
      </Dialog>
    );
  }

  if (step === "confirm" && to) {
    return (
      <Dialog label="Confirm transfer" onBack={() => setStep("select")} onClose={onClose}>
        <div className="w-cc">
          <div className="w-mb8">Sending Account</div>
          <div className="c60 t14">{me}</div>
          <div className="w-dv dashd" />
          <div>Receiving Account</div>
          <div className="c60 t14 w-mt8">{to.text}</div>
          <div className="w-dv dashd" />
          <div className="w-mb8">Total</div>
          <div className="w-ntt">
            <div className="w-ntr">
              <div className="c60">Total NFTs</div>
              <div className="f6">{n} NFT(s)</div>
            </div>
            <div className="w-ntr">
              <div className="c60">Total Weight</div>
              <div className="f6">{grams} g</div>
            </div>
            <div className="w-ntr">
              <div className="c60">Total GLDT Value</div>
              <div className="f6">{(grams * 100).toLocaleString("en-US")} GLDT</div>
            </div>
            {chosen.length > 0 && (
              <>
                <div className="w-hr8" />
                <div className="c60 w-mb8">By Collection:</div>
                {chosen.map((c) => (
                  <div key={c.key} className="w-bcr">
                    <div className="w-al">
                      <img className="w-bci" src={c.img} alt={c.label} />
                      <span className="c60">{c.label}</span>
                    </div>
                    <div className="f6">
                      {sel[c.key].length} NFT(s) - {sel[c.key].length * c.grams} g
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        <div className="w-mt32">
          <button type="button" className="btn block" onClick={confirm}>
            Confirm Transfer
          </button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog label={tab === "send" ? "Transfer NFTs" : "Receive"} title={null} size={tab === "send" ? undefined : "md"} onClose={onClose}>
      <div className="w-segw">
        <div className="seg">
          <button type="button" className={tab === "send" ? "on" : ""} onClick={() => setTab("send")}>
            Send
          </button>
          <button type="button" className={tab === "receive" ? "on" : ""} onClick={() => setTab("receive")}>
            Receive
          </button>
        </div>
      </div>
      {tab === "receive" ? (
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
            <div>Principal ID</div>
            <div className="w-rpill">
              <span className="adr lg tip" data-tip={me}>
                <span className="adri">
                  <span className="a1">{me.slice(0, 12)}</span>
                  <span className="a2">…</span>
                  <span className="a3">{me.slice(-12)}</span>
                </span>
                <button type="button" className="cpb" aria-label="Copy" onClick={() => copy(me)}>
                  <CopySm />
                </button>
              </span>
            </div>
          </div>
          <button type="button" className="btn block w-mt24" onClick={onClose}>
            Close
          </button>
        </>
      ) : (
        <div className="w-mt32">
          <div className="w-mb24">
            <div className="w-sh">Select NFTs to Transfer</div>
            <div className="w-pkl">
              {COLLECTIONS.map((c) => (
                <Picker
                  key={c.key}
                  c={c}
                  ids={data.nfts.data?.[c.key] ?? null}
                  selected={sel[c.key]}
                  onChange={(ids) => setSel((s) => ({ ...s, [c.key]: ids }))}
                />
              ))}
            </div>
          </div>
          <input
            className="w-nin"
            type="text"
            autoComplete="off"
            aria-label="Principal ID"
            placeholder="Principal ID"
            value={rcp}
            onChange={(e) => {
              setRcp(e.target.value);
              setTouched(true);
            }}
          />
          <p className="w-nerr">{touched ? err : ""}</p>
          <button type="button" className="btn block w-mt32" disabled={!to || n === 0} onClick={() => setStep("confirm")}>
            Transfer ({n} selected)
          </button>
        </div>
      )}
    </Dialog>
  );
};
