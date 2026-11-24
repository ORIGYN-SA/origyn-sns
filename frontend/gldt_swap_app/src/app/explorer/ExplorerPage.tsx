import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { isAddress } from "viem";

import "../styles/explorer.css";
import NavbarTop from "@components/shared/navbars/NavbarTop";
import { fetchExplorer, fetchExplorerStats, fetchGoldBacking, fetchPrice, fetchWallet, type Operation } from "../data/api";
import { parseIcrcAccount } from "../icp/accounts";
import { fmt, toNumber, usd } from "../lib/format";
import { toastAtom, useCopy, useMedia } from "../lib/ui";
import { Copy, External } from "../icons";
import { ChipX, Go, ListIcon, NotFound, Search } from "./icons";
import { Pager } from "./Pager";
import { Detail } from "./Detail";
import { Holders } from "./Holders";
import { Info } from "./Info";
import { KINDS, NETS, ago, filterOf, look, pill, sh, stage, type KindKey } from "./present";

type Tab = "tx" | "holders" | "info";

/** What the search box holds: a wallet becomes a chip, anything else is sent to the feed's search. */
const classify = (text: string): { kind: "wallet"; value: string } | { kind: "query"; value: string } | null => {
  const t = text.trim();
  if (!t) return null;
  if (isAddress(t, { strict: false })) return { kind: "wallet", value: t };
  const acct = parseIcrcAccount(t);
  if (acct) return { kind: "wallet", value: acct.text };
  return { kind: "query", value: t };
};

const Toast = () => {
  const toast = useAtomValue(toastAtom);
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    setShown(toast.message);
    const t = setTimeout(() => setShown(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  if (!shown) return null;
  return (
    <div className="ex-toastw">
      <div className="ex-toast" role="status" aria-live="polite">
        {shown}
      </div>
    </div>
  );
};

/** The gldt.org Explorer: every GLDT operation on every network, holders and supply. */
const ExplorerPage = () => {
  const phone = useMedia("(max-width: 767px)");
  const dark = useMedia("(prefers-color-scheme: dark)");
  const copy = useCopy();
  const [params, setParams] = useSearchParams();
  // "top_holders" is the old explorer's name for the holders tab.
  const tabParam = params.get("tab");
  const tab: Tab = tabParam === "holders" || tabParam === "top_holders" ? "holders" : tabParam === "info" ? "info" : "tx";
  const chips = (params.get("w") ?? "").split(",").filter(Boolean);
  const q = params.get("q") ?? "";
  const kind = (KINDS.find((k) => k.key === params.get("kind"))?.key ?? "all") as KindKey;
  const sub = params.get("sub") ?? "all";
  const page = Math.max(0, Number(params.get("page") ?? 0) || 0);
  const per = [10, 20, 50].includes(Number(params.get("per"))) ? Number(params.get("per")) : 20;
  const detailId = params.get("id");
  const [text, setText] = useState("");
  const [more, setMore] = useState(1);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  const set = (patch: Record<string, string | null>) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") n.delete(k);
        else n.set(k, v);
      }
      return n;
    });

  const price = useQuery({ queryKey: ["price", "GLDT"], queryFn: () => fetchPrice("GLDT"), staleTime: 60_000 }).data ?? null;
  const usdOf = (u: bigint) => (price === null ? "" : `≈ ${usd(toNumber(u, 8) * price)}`);
  const stats = useQuery({ queryKey: ["explorer-stats"], queryFn: fetchExplorerStats, staleTime: 30_000, retry: false }).data;

  const filter = filterOf(kind, sub);
  // The API serves at most 100 rows a page; on phones the list grows to that.
  const limit = phone ? Math.min(100, 20 * more) : per;
  const offset = phone ? 0 : page * per;
  const feed = useQuery({
    queryKey: ["explorer", q, chips.join(","), kind, sub, offset, limit],
    queryFn: () => fetchExplorer({ q: q || undefined, address: chips, ...filter, offset, limit }),
    placeholderData: keepPreviousData,
    refetchInterval: !q && !chips.length ? 10_000 : false,
  });
  const counts = useQueries({
    queries: KINDS.map((k) => ({
      queryKey: ["explorer-count", q, chips.join(","), k.key],
      queryFn: async () => (await fetchExplorer({ q: q || undefined, address: chips, ...k.filter, offset: 0, limit: 1 })).total_count,
      staleTime: 30_000,
    })),
  });
  const wallet = useQuery({
    queryKey: ["explorer-wallet", chips[0]],
    enabled: chips.length === 1,
    queryFn: () => fetchWallet(chips[0]),
    retry: false,
  });

  // A search that names one operation opens it.
  const rows = feed.data?.data ?? [];
  const total = feed.data?.total_count ?? 0;
  useEffect(() => {
    if (q && feed.data && !feed.isPlaceholderData && feed.data.total_count === 1 && feed.data.data[0] && !detailId) {
      set({ id: feed.data.data[0].id });
    }
    // Only a finished search moves on to its result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, feed.data, feed.isPlaceholderData]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const c = classify(text);
    if (!c) return;
    setText("");
    if (c.kind === "wallet") {
      if (!chips.includes(c.value) && chips.length < 5) set({ w: [...chips, c.value].join(","), q: null, page: null, id: null, tab: null });
    } else set({ q: c.value, page: null, id: null, tab: null });
    setMore(1);
  };
  const walletOnly = (a: string) => set({ w: a, q: null, page: null, id: null, tab: null, kind: null, sub: null });

  const tiles = [
    { l: "Transactions, 24H", v: stats ? fmt(stats.last_24h.transactions) : "—", s: "every kind, all networks" },
    {
      l: "Volume, 24H",
      v: stats ? `${fmt(toNumber(stats.last_24h.volume, 8), 0)} GLDT` : "—",
      s: stats && price !== null ? `≈ ${usd(toNumber(stats.last_24h.volume, 8) * price)}` : "",
    },
    { l: "Holders", v: stats ? fmt(stats.holders.total) : "—", s: "on all networks" },
    { l: "Gold in Swiss vaults", v: "", s: "backs every GLDT" },
  ];

  const pages = Math.max(1, Math.ceil(total / per));
  const head = chips.length ? `Transactions for ${chips.length === 1 ? "1 wallet" : `${chips.length} wallets`}` : q ? `Results for ${q}` : "Latest transactions";
  const kindDef = KINDS.find((k) => k.key === kind) ?? KINDS[0];
  const nothing = !feed.isLoading && rows.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <NavbarTop />
      <div className={`ex ${phone ? "phone" : ""}`} data-theme={dark ? "dark" : "light"}>
        <div className="ex-scr">
          <main className="ex-in ex-main">
            <div className="ex-title">
              <div className="ex-gold">GLDT</div>
              <div>Explorer</div>
            </div>
            <div className="ex-tabs" role="tablist" aria-label="Explorer">
              {(
                [
                  ["tx", "Transactions"],
                  ["holders", "Top 100 Holders"],
                  ["info", "Info"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  className={`ex-tab ${tab === k ? "on" : ""}`}
                  aria-selected={tab === k}
                  onClick={() => set({ tab: k === "tx" ? null : k, id: null })}
                >
                  {label}
                </button>
              ))}
            </div>
            {tab === "tx" && detailId && (
              <Detail id={detailId} phone={phone} usdOf={usdOf} onBack={() => set({ id: null })} onOpen={(id) => set({ id })} onWallet={walletOnly} />
            )}
            {tab === "tx" && !detailId && (
              <div className="ex-wrap">
                <div className="ex-tiles">
                  {tiles.map((x, i) => (
                    <div key={x.l} className="ex-tile">
                      <div className="ex-tl">{x.l}</div>
                      <div className="ex-tv">{i === 3 ? <GoldTile /> : x.v}</div>
                      <div className="ex-ts">{x.s}</div>
                    </div>
                  ))}
                </div>
                <div className="ex-bar">
                  <div className="ex-h">
                    <ListIcon />
                    <span>{head}</span>
                    {!chips.length && !q && (
                      <span className="ex-live">
                        <span className="ping" aria-hidden="true" />
                        Live
                      </span>
                    )}
                    {(chips.length > 0 || q) && (
                      <>
                        <span className="ex-rn">{fmt(total)} found</span>
                        <button type="button" className="ex-clr" onClick={() => set({ w: null, q: null, page: null })}>
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                  <form className="ex-sf" role="search" onSubmit={search}>
                    <Search className="ex-si" />
                    {chips.map((c) => (
                      <span key={c} className="ex-chip">
                        <img src={c.startsWith("0x") ? NETS.ethereum.logo : NETS.icp.logo} alt={c.startsWith("0x") ? "Ethereum" : "Internet Computer"} />
                        <span>{sh(c)}</span>
                        <button type="button" aria-label={`Remove ${c}`} onClick={() => set({ w: chips.filter((x) => x !== c).join(","), page: null })}>
                          <ChipX />
                        </button>
                      </span>
                    ))}
                    <label className="sr" htmlFor="ex-q">
                      Search GLDT transactions
                    </label>
                    <input
                      id="ex-q"
                      className="ex-in2"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={chips.length ? "Add another wallet" : phone ? "Address, tx hash or block" : "Search address, principal, tx hash, block or #ID"}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                    {text.trim() && (
                      <button type="submit" className="ex-go" aria-label="Search">
                        <Go />
                      </button>
                    )}
                  </form>
                </div>
                <div className="ex-pills" role="group" aria-label="Kind">
                  {KINDS.map((k, i) => (
                    <button
                      key={k.key}
                      type="button"
                      className={`ex-pill ${kind === k.key ? "on" : ""}`}
                      aria-pressed={kind === k.key}
                      onClick={() => set({ kind: k.key === "all" ? null : k.key, sub: null, page: null })}
                    >
                      {k.label}
                      <span className="ex-pn">{counts[i]?.data === undefined ? "" : fmt(counts[i].data ?? 0)}</span>
                    </button>
                  ))}
                </div>
                {kindDef.subs.length > 0 && (
                  <div className="ex-pills ex-subs2" role="group" aria-label="Type">
                    {kindDef.subs.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        className={`ex-sub2 ${sub === s.key ? "on" : ""}`}
                        aria-pressed={sub === s.key}
                        onClick={() => set({ sub: s.key === "all" ? null : s.key, page: null })}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
                {chips.length === 1 && wallet.data && (
                  <div className="ex-acct">
                    <div className="ex-card">
                      <div className="ex-lab">
                        {wallet.data.address_type === "evm" ? "Ethereum and Base address" : wallet.data.address_type === "principal" ? "Principal" : "Account"}
                      </div>
                      <div className="ex-accv">
                        <span className="mono">{wallet.data.address}</span>
                        <button type="button" className="ex-ib" aria-label="Copy" onClick={() => copy(wallet.data.address)}>
                          <Copy />
                        </button>
                      </div>
                      {wallet.data.address_type === "evm" && (
                        <div className="ex-acl">
                          {(["ethereum", "base"] as const).map((n) => (
                            <a
                              key={n}
                              className="ex-lk"
                              href={`${n === "ethereum" ? "https://etherscan.io" : "https://basescan.org"}/address/${wallet.data.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {n === "ethereum" ? "Etherscan" : "Basescan"}
                              <External width={12} height={12} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {wallet.data.subaccounts.length > 1 && (
                      <div className="ex-card">
                        <div className="ex-lab">Subaccounts</div>
                        <div className="ex-sbs">
                          {wallet.data.subaccounts.map((sa) => (
                            <button
                              key={sa.account}
                              type="button"
                              className={`ex-sub2 ${chips[0] === sa.account ? "on" : ""}`}
                              onClick={() => walletOnly(sa.account)}
                            >
                              {sa.subaccount === null ? "Default" : `Subaccount ${sa.subaccount.replace(/^0+/, "")}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {wallet.data.networks.map((nb) => (
                      <div key={nb.network} className="ex-card">
                        <div className="ex-lab">
                          <img src={NETS[nb.network].logo} alt="" />
                          {NETS[nb.network].name}
                        </div>
                        <div className="ex-accb">{fmt(toNumber(nb.balance, 8))} GLDT</div>
                        <div className="sub">{usdOf(nb.balance)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {nothing && (
                  <div className="ex-nf">
                    <NotFound />
                    <div className="ex-nft">
                      {q ? "Nothing found for" : chips.length ? "No transactions for" : "Nothing here yet"}{" "}
                      <span className="ex-nfq">{q || (chips.length ? `${sh(chips[0])}${chips.length > 1 ? ` and ${chips.length - 1} more` : ""}` : "")}</span>
                    </div>
                    <div className="ex-nfs">
                      {q ? "Check the address, hash, block or ID. New transactions show up here a few seconds after they happen." : "Try another filter. New transactions show up here a few seconds after they happen."}
                    </div>
                  </div>
                )}
                {!nothing && (
                  <>
                    {phone ? (
                      <div className="ex-cards">
                        {rows.map((t) => (
                          <Card key={t.id} op={t} now={now} usdOf={usdOf} onOpen={() => set({ id: t.id })} />
                        ))}
                      </div>
                    ) : (
                      <div className="ex-tbl">
                        <div className="ex-tr ex-th" aria-hidden="true">
                          <div>Age</div>
                          <div className="l">Activity</div>
                          <div>Amount</div>
                          <div className="l">From</div>
                          <div className="l">To</div>
                          <div>Kind</div>
                          <div>Status</div>
                          <div>Transaction</div>
                        </div>
                        {rows.map((t) => (
                          <Row key={t.id} op={t} now={now} usdOf={usdOf} onOpen={() => set({ id: t.id })} onWallet={walletOnly} />
                        ))}
                      </div>
                    )}
                    {phone ? (
                      <div className="ex-more">
                        {rows.length < total && rows.length < 100 && (
                          <button type="button" className="ex-btn ol block" onClick={() => setMore((m) => m + 1)}>
                            Load more
                          </button>
                        )}
                        <div className="sub">
                          Showing {rows.length} of {fmt(total)}
                        </div>
                      </div>
                    ) : (
                      <div className="ex-pg">
                        <div className="ex-per">
                          <label htmlFor="ex-per">Lines per page</label>
                          <select id="ex-per" value={String(per)} onChange={(e) => set({ per: e.target.value === "20" ? null : e.target.value, page: null })}>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                          </select>
                        </div>
                        <div className="sub">
                          Showing {total ? page * per + 1 : 0} to {page * per + rows.length} of {fmt(total)}
                        </div>
                        <Pager page={page} pages={pages} onPage={(n) => set({ page: n ? String(n) : null })} />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {tab === "holders" && <Holders phone={phone} usdOf={usdOf} onWallet={(a) => set({ tab: null, w: a, q: null, id: null, page: null })} />}
            {tab === "info" && <Info price={price} holders={stats?.holders.total ?? null} />}
          </main>
        </div>
      </div>
      <Toast />
    </div>
  );
};

const GoldTile = () => {
  const gold = useQuery({ queryKey: ["gold-backing"], queryFn: fetchGoldBacking, staleTime: 300_000 });
  return <>{gold.data === undefined ? "—" : `${fmt(gold.data / 1000, 2)} kg`}</>;
};

const Avatars = ({ op, usdOf }: { op: Operation; usdOf: (u: bigint) => string }) => {
  const L = look(op, usdOf);
  return (
    <>
      <span className="av">
        <img src={L.a.i} alt={L.a.ia} />
        <span className="avb">
          <img src={L.a.l} alt={L.a.la} />
        </span>
      </span>
      {L.b && (
        <>
          <span className="arw" aria-hidden="true">
            →
          </span>
          <span className="av">
            <img src={L.b.i} alt={L.b.ia} />
            <span className="avb">
              <img src={L.b.l} alt={L.b.la} />
            </span>
          </span>
        </>
      )}
    </>
  );
};

const WalletCell = ({ a, net, onWallet }: { a: string | null; net: Operation["from_chain"]; onWallet: (a: string) => void }) =>
  a ? (
    <button type="button" className="ex-w" onClick={(e) => (e.stopPropagation(), onWallet(a))} aria-label={`Show transactions for ${sh(a)}`}>
      <img src={NETS[net].logo} alt="" />
      {sh(a)}
    </button>
  ) : (
    <span className="ex-w0">{sh(a)}</span>
  );

const Row = ({ op, now, usdOf, onOpen, onWallet }: { op: Operation; now: number; usdOf: (u: bigint) => string; onOpen: () => void; onWallet: (a: string) => void }) => {
  const L = look(op, usdOf);
  const p = pill(op);
  const st = stage(op);
  return (
    <div className="ex-tr" onClick={onOpen}>
      <div className="ex-age">{ago(op.started_at, now)}</div>
      <div className="ex-act">
        <Avatars op={op} usdOf={usdOf} />
        <div className="ex-at">
          <button
            type="button"
            className="ex-rt"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            {L.title}
          </button>
          <div className="ex-rs">{L.sub}</div>
        </div>
      </div>
      <div>
        <div className="b">{L.amt}</div>
        <div className="sub">{L.amtSub}</div>
      </div>
      <div className="l">
        <WalletCell a={op.from_address} net={op.from_chain} onWallet={onWallet} />
      </div>
      <div className="l">
        <WalletCell a={op.to_address} net={op.to_chain} onWallet={onWallet} />
      </div>
      <div>
        <span className="ex-kb">
          {L.kImg && <img src={L.kImg} alt="" />}
          {L.kLab}
        </span>
      </div>
      <div>
        <span className={`ex-sp ${p.pc}`}>
          {p.dot && <span className="ping" aria-hidden="true" />}
          {p.pl}
        </span>
        {st && <div className="sub">{st}</div>}
      </div>
      <div className="mono">{L.tx}</div>
    </div>
  );
};

const Card = ({ op, now, usdOf, onOpen }: { op: Operation; now: number; usdOf: (u: bigint) => string; onOpen: () => void }) => {
  const L = look(op, usdOf);
  const p = pill(op);
  return (
    <div className="ex-crd" onClick={onOpen}>
      <div className="ex-cl2">
        <Avatars op={op} usdOf={usdOf} />
        <div className="ex-ct">
          <button
            type="button"
            className="ex-rt"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            {L.card}
          </button>
          <div className="ex-rs">{L.amt}</div>
        </div>
      </div>
      <div className="ex-cr">
        <span className={`ex-sp ${p.pc}`}>
          {p.dot && <span className="ping" aria-hidden="true" />}
          {p.pl}
        </span>
        <div className="sub">{ago(op.started_at, now)}</div>
      </div>
    </div>
  );
};

export default ExplorerPage;
