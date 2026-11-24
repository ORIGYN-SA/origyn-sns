import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { Copy } from "../icons";
import { fetchBridgeSupply, fetchHolders, type Chain } from "../data/api";
import { fmt, toNumber } from "../lib/format";
import { useCopy } from "../lib/ui";
import { ListIcon } from "./icons";
import { Pager } from "./Pager";
import { NETS, sh } from "./present";

const NET_PILLS: { key: "all" | Chain; label: string }[] = [
  { key: "all", label: "All networks" },
  { key: "icp", label: "Internet Computer" },
  { key: "ethereum", label: "Ethereum" },
  { key: "base", label: "Base" },
];
const PER = 10;
const TOP = 100;

/** The Top 100 Holders tab: holders on every network or one, with their share of the supply. */
export const Holders = ({ phone, usdOf, onWallet }: { phone: boolean; usdOf: (u: bigint) => string; onWallet: (a: string) => void }) => {
  const copy = useCopy();
  const [net, setNet] = useState<"all" | Chain>("all");
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(1);
  const limit = phone ? PER * more : PER;
  const offset = phone ? 0 : page * PER;
  const q = useQuery({
    queryKey: ["explorer-holders", net, offset, limit],
    queryFn: () => fetchHolders({ network: net === "all" ? ["icp", "ethereum", "base"] : [net], offset, limit }),
    placeholderData: keepPreviousData,
  });
  const supply = useQuery({ queryKey: ["bridge-supply"], queryFn: fetchBridgeSupply, staleTime: 60_000 }).data;
  const rows = q.data?.data ?? [];
  const total = Math.min(TOP, q.data?.total_count ?? 0);
  const pages = Math.max(1, Math.ceil(total / PER));
  const max = rows[0]?.balance ?? 1n;
  const share = (b: bigint) => (supply && supply.total > 0n ? `${((Number(b) / Number(supply.total)) * 100).toFixed(2)}%` : "");
  const pick = (k: "all" | Chain) => {
    setNet(k);
    setPage(0);
    setMore(1);
  };
  return (
    <div className="ex-wrap">
      <div className="ex-bar">
        <div className="ex-h">
          <ListIcon />
          <span>Top 100 holders</span>
        </div>
      </div>
      <div className="ex-pills" role="group" aria-label="Network">
        {NET_PILLS.map((p) => (
          <button key={p.key} type="button" className={`ex-pill ${net === p.key ? "on" : ""}`} aria-pressed={net === p.key} onClick={() => pick(p.key)}>
            {p.label}
          </button>
        ))}
      </div>
      {phone ? (
        <div className="ex-cards">
          {rows.map((h, i) => (
            <div key={`${h.network}-${h.address}`} className="ex-hc">
              <div className="ex-hcl">
                <span className="ex-rank">{offset + i + 1}</span>
                <div className="ex-ct">
                  <button type="button" className="ex-w" onClick={() => onWallet(h.address)} aria-label={`Show transactions for ${h.address}`}>
                    <img src={NETS[h.network].logo} alt={NETS[h.network].name} />
                    {sh(h.address)}
                  </button>
                  <div className="sub">{NETS[h.network].name}</div>
                </div>
              </div>
              <div className="ex-cr">
                <div className="b">{fmt(toNumber(h.balance, 8), 2)} GLDT</div>
                <div className="sub">{share(h.balance)} of supply</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ex-tbl ex-htbl">
          <div className="ex-tr ex-th" aria-hidden="true">
            <div>Rank</div>
            <div className="l">Wallet</div>
            <div className="l">Network</div>
            <div>Balance</div>
            <div className="l">Share of supply</div>
          </div>
          {rows.map((h, i) => (
            <div key={`${h.network}-${h.address}`} className="ex-tr">
              <div>
                <span className="ex-rank">{offset + i + 1}</span>
              </div>
              <div className="l">
                <span className="ex-w">
                  <button type="button" className="ex-w" onClick={() => onWallet(h.address)} aria-label={`Show transactions for ${h.address}`}>
                    {sh(h.address)}
                  </button>
                  <button type="button" className="ex-ib" aria-label="Copy" onClick={() => copy(h.address)}>
                    <Copy />
                  </button>
                </span>
              </div>
              <div className="l">
                <span className="ex-net">
                  <img src={NETS[h.network].logo} alt="" />
                  {NETS[h.network].name}
                </span>
              </div>
              <div>
                <div className="b">{fmt(toNumber(h.balance, 8), 2)} GLDT</div>
                <div className="sub">{usdOf(h.balance)}</div>
              </div>
              <div className="ex-share">
                <span className="ex-bar2">
                  <span style={{ width: `${Math.max(2, Math.round((Number(h.balance) / Number(max || 1n)) * 100))}%` }} />
                </span>
                <span className="b">{share(h.balance)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {phone ? (
        <div className="ex-more">
          {rows.length < total && (
            <button type="button" className="ex-btn ol block" onClick={() => setMore((m) => m + 1)}>
              Load more
            </button>
          )}
          <div className="sub">
            Showing {rows.length} of {total}
          </div>
        </div>
      ) : (
        <div className="ex-pg">
          <div />
          <div className="sub">
            Showing {total ? page * PER + 1 : 0} to {page * PER + rows.length} of {total}
          </div>
          <Pager page={page} pages={pages} onPage={setPage} />
        </div>
      )}
    </div>
  );
};
