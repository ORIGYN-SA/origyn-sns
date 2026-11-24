import { useCallback, useEffect, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";

import { ArrowDown, CheckCircle, Chevron, XCircle } from "../icons";
import { COLLECTIONS, nftValueE8s, type Collection } from "../icp/canisters";
import { fmt, toNumber } from "../lib/format";
import { Dialog } from "../shell/Dialog";
import { Picker } from "./Picker";
import type { WalletData } from "./model";
import type { Selection } from "./Picker";
import { NONE } from "./selection";
import {
  LEDGER_FEE_E8S,
  REVERSE_FEE_E8S,
  approveNfts,
  approveReverse,
  availableNfts,
  swapGldtForNfts,
  swapNftsForGldt,
} from "./swap";

export type SwapMode = "mint" | "burn";

type Job = { c: Collection; ids: bigint[]; approve: "idle" | "pend" | "ok" | "bad"; swap: "idle" | "pend" | "ok" | "bad" };

const JobIcon = ({ st }: { st: "idle" | "pend" | "ok" | "bad" }) =>
  st === "pend" ? (
    <div className="spin" />
  ) : st === "ok" ? (
    <CheckCircle className="ok" />
  ) : st === "bad" ? (
    <XCircle className="err" />
  ) : (
    <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );

/** Mint (GLD NFTs to GLDT) and Burn (GLDT to GLD NFTs from gldt_swap's stock), one collection at a
 * time: an approve, then the swap. */
export const SwapDialog = ({
  data,
  initial,
  onClose,
}: {
  data: WalletData;
  initial: SwapMode;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<SwapMode>(initial);
  const [step, setStep] = useState<"submit" | "confirm" | "details">("submit");
  const [sel, setSel] = useState<Selection>(NONE);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const signer = data.icp?.kind === "signedIn" ? data.icp.signer : null;
  const anon = data.icp?.anon ?? null;

  // gldt_swap's stock, for Burn.
  const stock = useQueries({
    queries: COLLECTIONS.map((c) => ({
      queryKey: ["swap-stock", c.key],
      enabled: mode === "burn" && !!anon,
      staleTime: 30_000,
      queryFn: () => {
        if (!anon) throw new Error("no agent");
        return availableNfts(anon, c);
      },
    })),
  });

  const source = (c: Collection, i: number): bigint[] | null =>
    mode === "mint" ? data.nfts.data?.[c.key] ?? null : stock[i].data ?? null;

  const chosen = COLLECTIONS.filter((c) => sel[c.key].length > 0);
  const n = chosen.reduce((a, c) => a + sel[c.key].length, 0);
  const grams = chosen.reduce((a, c) => a + sel[c.key].length * c.grams, 0);
  const valueE8s = chosen.reduce((a, c) => a + BigInt(sel[c.key].length) * nftValueE8s(c), 0n);
  const gldt = toNumber(valueE8s, 8);
  // Burn costs the NFTs' value, 1 GLDT per NFT, and the approve's fee per collection.
  const burnFees = BigInt(n) * REVERSE_FEE_E8S;
  const burnLedgerFees = BigInt(chosen.length) * LEDGER_FEE_E8S;
  const burnTotal = valueE8s + burnFees + burnLedgerFees;
  const bal = data.balOf({ kind: "icp", sym: "GLDT" });
  const balE8s = bal.kind === "ready" ? bal.units : null;
  const short = mode === "burn" && balE8s !== null && burnTotal > balE8s;

  const switchMode = (m: SwapMode) => {
    if (m === mode) return;
    setMode(m);
    setSel(NONE);
    setStep("submit");
  };

  const runJob = useCallback(
    async (job: Job) => {
      if (!signer) return;
      const set = (patch: Partial<Job>) => setJobs((js) => js.map((j) => (j.c.key === job.c.key ? { ...j, ...patch } : j)));
      try {
        if (job.approve !== "ok") {
          set({ approve: "pend" });
          if (mode === "mint") await approveNfts(signer, job.c, job.ids);
          else await approveReverse(signer, job.c, job.ids.length);
          set({ approve: "ok" });
        }
      } catch (e) {
        console.error("Swap approve failed", e);
        set({ approve: "bad" });
        return;
      }
      try {
        set({ swap: "pend" });
        if (mode === "mint") await swapNftsForGldt(signer, job.c, job.ids);
        else await swapGldtForNfts(signer, job.c, job.ids);
        set({ swap: "ok" });
      } catch (e) {
        console.error("Swap failed", e);
        // gldt_swap takes its fee before the burn, so a failed burn leaves the GLDT allowance short:
        // a Retry approves again.
        set(mode === "burn" ? { swap: "bad", approve: "idle" } : { swap: "bad" });
      } finally {
        await queryClient.invalidateQueries({
          predicate: (q) => ["icp-balance", "icp-history", "nft-holdings", "nft-history", "swap-stock"].includes(String(q.queryKey[0])),
        });
      }
    },
    [mode, signer, queryClient]
  );

  const confirm = () => {
    const next: Job[] = chosen.map((c) => ({ c, ids: sel[c.key].slice(), approve: "idle", swap: "idle" }));
    setJobs(next);
    setSel(NONE);
    setStep("details");
  };

  // The collections run one after another once the details step shows them: an ICRC-2 approve
  // replaces the allowance, so a Burn of one collection must finish before the next approves.
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (step !== "details" || started) return;
    setStarted(true);
    void (async () => {
      for (const j of jobs) await runJob(j);
    })();
  }, [step, started, jobs, runJob]);

  const aria = mode === "burn" ? "Burn" : "Mint";

  if (step === "details") {
    return (
      <Dialog label={aria} title={null} onClose={onClose}>
        <div className="w-mt16">
          <div>
            <div className="w-dgrid">
              {jobs.map((j) => {
                const swapping = j.approve === "ok" || j.swap === "bad";
                const st = j.swap === "bad" ? "bad" : j.approve !== "ok" ? j.approve : j.swap;
                return (
                  <div key={j.c.key} className="w-dcol">
                    <div className="w-dct">{j.c.label} collection</div>
                    <div className="w-dr">
                      <div className="w-arow">
                        <div className="w-drl">
                          <div>
                            <div className="stbox">
                              <JobIcon st={st} />
                            </div>
                          </div>
                          <div>{!swapping ? "Approve" : mode === "burn" ? "Burning" : "Minting"}</div>
                        </div>
                        {st === "bad" && (
                          <div>
                            <button type="button" className="btn sm" onClick={() => void runJob(j)}>
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button type="button" className="btn block" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  if (step === "confirm") {
    return (
      <Dialog label={aria} onBack={() => setStep("submit")} onClose={onClose}>
        <div className="w-mt16">
          <div>
            <div className="w-cfm">
              {mode === "mint" ? (
                <div className="w-tcn">
                  You are sending <span className="copper f6">{n} GLD NFTs</span> and will receive{" "}
                  <span className="copper f6">{fmt(gldt)} GLDT.</span>
                </div>
              ) : (
                <div className="w-tcn">
                  You are sending <span className="copper f6">{fmt(toNumber(burnTotal, 8))} GLDT</span> and will receive{" "}
                  <span className="copper f6">{grams}g GLD NFTs</span>. <br />
                  <span className="copper f6">{fmt(gldt)} GLDT</span> will be burned and <span className="copper f6">{n} GLDT</span> fee is
                  charged. <span className="copper f6">{chosen.length} x 0.1 GLDT</span> approvals are required.
                </div>
              )}
              <div className="w-conv">
                <div className="f6">{mode === "mint" ? `${grams}g of gold` : `${fmt(toNumber(burnTotal, 8))} GLDT`}</div>
                <div className="w-sepw">
                  <div className="w-sepr">
                    <div className="w-sepl" />
                    <div className="w-sepb">
                      <button type="button" className="w-sepc">
                        <ArrowDown className="gold" width={24} height={24} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="f6">{mode === "mint" ? `${fmt(gldt)} GLDT` : `${grams}g of gold`}</div>
              </div>
              <div>
                <div>
                  <div className="w-dsh">
                    <div className="w-dsl">
                      <div className="f5">Transaction details</div>
                    </div>
                    <button type="button" className="w-dsb" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((o) => !o)}>
                      <Chevron className={detailsOpen ? "rot180" : ""} />
                    </button>
                  </div>
                  {detailsOpen && (
                    <div className="w-dsp">
                      <div className="w-dsx">
                        {mode === "mint" ? (
                          <div className="w-dsr">
                            <div>Amount to be minted</div>
                            <div>{fmt(gldt)} GLDT</div>
                          </div>
                        ) : (
                          <div className="w-dsr">
                            <div>Total number of NFTs to receive</div>
                            <div>{n} GLD NFT</div>
                          </div>
                        )}
                        <div className="w-bb" />
                        <div className="w-dsr f6">
                          <div>Total number of NFTs to be swapped</div>
                          <div>{n} GLD NFT</div>
                        </div>
                        {chosen.map((c) => (
                          <div key={c.key} className="w-dsr">
                            <div>{c.grams}g GLD NFT</div>
                            <div>{sel[c.key].length}x</div>
                          </div>
                        ))}
                        <div className="w-dsr f6">
                          <div>Total grams of gold</div>
                          <div>{grams}g</div>
                        </div>
                        {mode === "burn" && (
                          <>
                            <div className="w-dsr f6">
                              <div>Conversion fee</div>
                              <div>{n} GLDT</div>
                            </div>
                            <div className="w-dsr f6">
                              <div>Approval fee</div>
                              <div>{fmt(toNumber(burnLedgerFees, 8))} GLDT</div>
                            </div>
                            <div className="w-dsr f6">
                              <div>Total number of GLDT burned</div>
                              <div>{fmt(gldt)} GLDT</div>
                            </div>
                          </>
                        )}
                        <div className="w-dst">
                          <div>Total</div>
                          <div>{mode === "mint" ? `${fmt(gldt)} GLDT` : `${fmt(toNumber(burnTotal, 8))} GLDT`}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button type="button" className="btn block" onClick={confirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    );
  }

  const pickers = (
    <div>
      {COLLECTIONS.map((c, i) => (
        <Picker key={c.key} c={c} ids={source(c, i)} selected={sel[c.key]} onChange={(ids) => setSel((s) => ({ ...s, [c.key]: ids }))} />
      ))}
    </div>
  );

  return (
    <Dialog label={aria} title={null} onClose={onClose}>
      <div className="w-swc">
        <div>
          <div className="seg">
            <button type="button" className={mode === "mint" ? "on" : ""} onClick={() => switchMode("mint")}>
              Mint
            </button>
            <button type="button" className={mode === "burn" ? "on" : ""} onClick={() => switchMode("burn")}>
              Burn
            </button>
          </div>
        </div>
      </div>
      {mode === "mint" ? (
        <>
          <div className="w-mbx">
            <div className="lbl">From</div>
            {pickers}
          </div>
          <div className="w-mt16 w-mbx">
            <div className="lbl">To</div>
            <div className="w-gbx">
              <div>{fmt(gldt)} GLDT</div>
            </div>
          </div>
          <div className="w-mt32">
            <button type="button" className="btn block" disabled={n === 0} onClick={() => setStep("confirm")}>
              Submit
            </button>
          </div>
        </>
      ) : balE8s === null ? (
        <div className="w-fetch">
          <div>
            <div className="spin" />
          </div>
          <div>Fetching your balance and more...</div>
        </div>
      ) : (
        <>
          <div className="w-mbx">
            <div className="lbl">From</div>
            {short ? (
              <div className="w-warn">
                <div className="w-wt">
                  <div className="f6 w-mb8">You don't have enough GLDT to process.</div>
                  <div className="t14">
                    To burn the <span className="f6">{n} GLD NFT</span> selected you need to have at least{" "}
                    <span className="f6">{fmt(toNumber(burnTotal, 8))} GLDT</span>.<br />
                    Includes <span className="f6">{chosen.length} x 0.1 GLDT</span> approvals.
                    <br />
                    Your current balance is <span className="f6">{fmt(toNumber(balE8s, 8))} GLDT.</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-gbx">
                  <div>{fmt(gldt)} GLDT</div>
                </div>
                {n > 0 && (
                  <div className="w-mt16">
                    <div className="t14">
                      You are burning <span className="copper f6">{fmt(gldt)} GLDT</span> and will receive{" "}
                      <span className="copper f6">{n} GLD NFTs</span>.<br />
                      For this, you are charged a fee of <span className="copper f6">{n} x 1 GLDT</span>.<br />
                      Approving selected collections costs <span className="copper f6">{chosen.length} x 0.1 GLDT</span>.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="w-mt16 w-mbx">
            <div className="lbl">To</div>
            {pickers}
          </div>
          <div className="w-mt32">
            <button type="button" className="btn block" disabled={short || n === 0} onClick={() => setStep("confirm")}>
              Submit
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
};
