import { useCallback, useEffect, useRef, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { isAddress, type Address } from "viem";

import { swapNftsForEvm } from "../bridge/calls";
import { useClaim } from "../bridge/claim";
import { useBridgeOperation } from "../bridge/history";
import { NET, stepsOf, type StepState } from "../bridge/model";
import type { EvmNet } from "../evm/chains";
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

/** Where Mint puts the GLDT: on the Internet Computer, or as a claim on Ethereum or Base. */
export type MintNet = "icp" | EvmNet;
const MINT_NETS: MintNet[] = ["icp", "ethereum", "base"];

/** swap_nft_for_evm takes at most this many NFTs in one call. */
const MAX_NFTS_TO_EVM = 100;

type Job = { c: Collection; ids: bigint[]; approve: "idle" | "pend" | "ok" | "bad"; swap: "idle" | "pend" | "ok" | "bad" };

/** A Mint to Ethereum or Base once confirmed: its recipient, the swap call, and the transfer it made. */
type EvmMint = { net: EvmNet; to: Address; send: StepState; opId: string | null };

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
 * time: an approve, then the swap. Mint to Ethereum or Base approves each collection, then one
 * swap_nft_for_evm call signs a claim voucher, which the user claims on that chain. */
export const SwapDialog = ({
  data,
  initial,
  initialNet = "icp",
  onConnectEvm,
  onClose,
}: {
  data: WalletData;
  initial: SwapMode;
  initialNet?: MintNet;
  onConnectEvm: () => void;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<SwapMode>(initial);
  const [net, setNet] = useState<MintNet>(initialNet);
  const [netOpen, setNetOpen] = useState(false);
  const [rc, setRc] = useState<string>(data.evmAddress ?? "");
  const [evm, setEvm] = useState<EvmMint | null>(null);
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

  // Mint to Ethereum or Base: the recipient, an address with a valid checksum when mixed case.
  const toEvm = mode === "mint" && net !== "icp";
  const rcT = rc.trim();
  const rcAddr = /^0x[0-9A-F]{40}$/.test(rcT) ? rcT.toLowerCase() : rcT;
  const evmTo: Address | null = isAddress(rcAddr) ? rcAddr : null;
  const rcBad = toEvm && rcT !== "" && evmTo === null;
  const tooMany = toEvm && n > MAX_NFTS_TO_EVM;
  const mine = data.evmAddress ?? null;

  // A wallet connected from the dialog fills an empty recipient.
  useEffect(() => {
    if (mine && rc === "") setRc(mine);
  }, [mine, rc]);

  const switchMode = (m: SwapMode) => {
    if (m === mode) return;
    setMode(m);
    setSel(NONE);
    setStep("submit");
  };

  // Collections whose NFTs gldt_swap may take for a Mint to Ethereum or Base.
  const approved = useRef(new Set<string>());

  const runJob = useCallback(
    async (job: Job, approveOnly: boolean): Promise<boolean> => {
      if (!signer) return false;
      const set = (patch: Partial<Job>) => setJobs((js) => js.map((j) => (j.c.key === job.c.key ? { ...j, ...patch } : j)));
      try {
        if (job.approve !== "ok" && !approved.current.has(job.c.key)) {
          set({ approve: "pend" });
          if (mode === "mint") await approveNfts(signer, job.c, job.ids);
          else await approveReverse(signer, job.c, job.ids.length);
          set({ approve: "ok" });
        }
        approved.current.add(job.c.key);
      } catch (e) {
        console.error("Swap approve failed", e);
        set({ approve: "bad" });
        return false;
      }
      if (approveOnly) return true;
      try {
        set({ swap: "pend" });
        if (mode === "mint") await swapNftsForGldt(signer, job.c, job.ids);
        else await swapGldtForNfts(signer, job.c, job.ids);
        set({ swap: "ok" });
        return true;
      } catch (e) {
        console.error("Swap failed", e);
        // gldt_swap takes its fee before the burn, so a failed burn leaves the GLDT allowance short:
        // a Retry approves again.
        if (mode === "burn") approved.current.delete(job.c.key);
        set(mode === "burn" ? { swap: "bad", approve: "idle" } : { swap: "bad" });
        return false;
      } finally {
        await queryClient.invalidateQueries({
          predicate: (q) => ["icp-balance", "icp-history", "nft-holdings", "nft-history", "swap-stock"].includes(String(q.queryKey[0])),
        });
      }
    },
    [mode, signer, queryClient]
  );

  // The swap for a Mint to Ethereum or Base, once every collection is approved; sent at most once.
  const sent = useRef(false);
  const sendEvm = useCallback(
    async (m: EvmMint, js: Job[]) => {
      if (!signer || sent.current || js.some((j) => !approved.current.has(j.c.key))) return;
      sent.current = true;
      setEvm((e) => e && { ...e, send: "pend" });
      try {
        const nfts = { ...NONE };
        for (const j of js) nfts[j.c.key] = j.ids;
        const out = await swapNftsForEvm(signer, m.net, m.to, nfts);
        setEvm((e) => e && { ...e, send: "ok", opId: `out-${out.id}` });
      } catch (e) {
        console.error("Mint to " + m.net + " failed", e);
        // The swap moves no NFT when it fails, so a Retry sends it again.
        sent.current = false;
        setEvm((x) => x && { ...x, send: "bad" });
      } finally {
        await queryClient.invalidateQueries({
          predicate: (q) => ["nft-holdings", "nft-history", "bridge-history", "explorer-wallet"].includes(String(q.queryKey[0])),
        });
      }
    },
    [signer, queryClient]
  );

  const confirm = () => {
    const next: Job[] = chosen.map((c) => ({ c, ids: sel[c.key].slice(), approve: "idle", swap: "idle" }));
    setJobs(next);
    if (toEvm && evmTo) setEvm({ net, to: evmTo, send: "idle", opId: null });
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
      for (const j of jobs) await runJob(j, evm !== null);
      if (evm) await sendEvm(evm, jobs);
    })();
  }, [step, started, jobs, runJob, evm, sendEvm]);

  const retryJob = async (j: Job) => {
    const ok = await runJob(j, evm !== null);
    if (ok && evm) await sendEvm(evm, jobs);
  };

  // The transfer the swap made, and its claim.
  const evmNet: EvmNet = evm?.net ?? "ethereum";
  const detail = useBridgeOperation(evm?.opId ?? null).data ?? null;
  const claimer = useClaim(evmNet, detail);
  const allApproved = jobs.length > 0 && jobs.every((j) => j.approve === "ok");
  const evSteps = evm
    ? stepsOf("icp", evmNet, [allApproved ? "ok" : "pend", evm.send, evm.send === "ok" ? "pend" : "idle", "idle"], detail, true).slice(1)
    : [];
  const claimRun = claimer.run;
  const claimState: StepState = claimRun ? (claimRun[0] !== "ok" ? claimRun[0] : claimRun[1] ?? "idle") : evSteps[2]?.state ?? "idle";
  const canClaim = !!evm && claimer.ready && (claimRun === null || claimRun.includes("bad")) && claimState !== "ok";

  const aria = mode === "burn" ? "Burn" : "Mint";

  if (step === "details") {
    return (
      <Dialog label={aria} title={null} onClose={onClose}>
        <div className="w-mt16">
          <div>
            <div className="w-dgrid">
              {jobs.map((j) => {
                const swapping = j.approve === "ok" || j.swap === "bad";
                const st = evm ? j.approve : j.swap === "bad" ? "bad" : j.approve !== "ok" ? j.approve : j.swap;
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
                          <div>{!swapping || evm ? "Approve" : mode === "burn" ? "Burning" : "Minting"}</div>
                        </div>
                        {st === "bad" && (
                          <div>
                            <button type="button" className="btn sm" onClick={() => void retryJob(j)}>
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {evm && (
                <div className="w-dcol">
                  <div className="w-dct">GLDT on {NET[evm.net].name}</div>
                  <div className="mn-steps">
                    {evSteps.map((stp, i) => {
                      const state = i === 2 ? claimState : stp.state;
                      return (
                        <div key={stp.label} className="w-dr">
                          <div className="w-arow">
                            <div className="w-drl">
                              <div>
                                <div className="stbox">
                                  <JobIcon st={state} />
                                </div>
                              </div>
                              <div>{stp.label}</div>
                            </div>
                            {i === 0 && evm.send === "bad" && (
                              <div>
                                <button type="button" className="btn sm" onClick={() => void sendEvm(evm, jobs)}>
                                  Retry
                                </button>
                              </div>
                            )}
                            {i === 2 && canClaim && (
                              <div>
                                <button type="button" className="btn sm" onClick={mine ? () => void claimer.claim() : onConnectEvm}>
                                  {mine ? "Claim" : "Connect"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                  <span className="copper f6">
                    {fmt(gldt)} GLDT{toEvm ? ` on ${NET[net].name}` : ""}.
                  </span>
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
                          <>
                            <div className="w-dsr">
                              <div>Amount to be minted</div>
                              <div>{fmt(gldt)} GLDT</div>
                            </div>
                            {toEvm && evmTo && (
                              <>
                                <div className="w-dsr">
                                  <div>Network</div>
                                  <div>{NET[net].name}</div>
                                </div>
                                <div className="w-dsr">
                                  <div>Recipient</div>
                                  <div>
                                    {evmTo.slice(0, 6)}...{evmTo.slice(-4)}
                                  </div>
                                </div>
                                <div className="w-dsr">
                                  <div>Fee</div>
                                  <div>None</div>
                                </div>
                                <div className="w-dsr">
                                  <div>Claim on {NET[net].name}</div>
                                  <div>Paid in ETH</div>
                                </div>
                              </>
                            )}
                          </>
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
            <div className="mn-row">
              <div className="w-gbx">
                <div>{fmt(gldt)} GLDT</div>
              </div>
              <div className="mn-selw">
                <button
                  type="button"
                  className="mn-selb"
                  onClick={() => setNetOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={netOpen}
                  aria-label="Receive on"
                >
                  <div className="mn-seli">
                    <div className="mn-sell">
                      <span className={`mn-lg ${NET[net].w}`}>
                        <img src={NET[net].logo} alt={NET[net].alt} />
                      </span>
                      <div>{NET[net].name}</div>
                    </div>
                    <Chevron className="mn-chev" width={18} height={18} />
                  </div>
                </button>
                {netOpen && (
                  <div className="lbxo mn-selo" role="listbox" aria-label="Receive on">
                    {MINT_NETS.map((k) => (
                      <button
                        key={k}
                        type="button"
                        className="lbxi"
                        role="option"
                        aria-selected={k === net}
                        onClick={() => {
                          setNet(k);
                          setNetOpen(false);
                        }}
                      >
                        <div className="mn-opt">
                          <span className={`mn-lg ${NET[k].w}`}>
                            <img src={NET[k].logo} alt={NET[k].alt} />
                          </span>
                          <div>{NET[k].name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {toEvm && (
              <div className="w-mt16">
                <label className="lbl" htmlFor="mint-recipient">
                  Recipient on {NET[net].name}
                </label>
                <div className="mn-rc">
                  <input
                    id="mint-recipient"
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="0x..."
                    value={rc}
                    onChange={(e) => setRc(e.target.value)}
                  />
                  {mine && rcT.toLowerCase() !== mine.toLowerCase() && (
                    <button type="button" className="maxb" onClick={() => setRc(mine)}>
                      Mine
                    </button>
                  )}
                  {!mine && (
                    <button type="button" className="maxb" onClick={onConnectEvm}>
                      Connect
                    </button>
                  )}
                </div>
                {rcBad && <div className="mn-err">Invalid Ethereum address</div>}
                {tooMany && <div className="mn-err">Up to {MAX_NFTS_TO_EVM} GLD NFTs in one mint</div>}
                <div className="t14 c60 w-mt8">No fee. Then claim on {NET[net].name}: paid in ETH</div>
              </div>
            )}
          </div>
          <div className="w-mt32">
            <button
              type="button"
              className="btn block"
              disabled={n === 0 || (toEvm && (evmTo === null || tooMany))}
              onClick={() => setStep("confirm")}
            >
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
