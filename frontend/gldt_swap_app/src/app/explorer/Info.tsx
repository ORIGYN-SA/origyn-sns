import { useQuery } from "@tanstack/react-query";

import { GLDT_LEDGER_CANISTER_ID, SWAP_CANISTER_ID } from "@constants";
import { Copy, External } from "../icons";
import { fetchBridgeSupply, fetchGoldBacking } from "../data/api";
import { GLDT_TOKEN } from "../evm/chains";
import { fmt, toNumber, usd } from "../lib/format";
import { useCopy } from "../lib/ui";
import { NETS } from "./present";

/** The Info tab: GLDT's supply, gold, price, holders, fee and decimals, its supply per network and
 * the canisters and contracts. */
export const Info = ({ price, holders }: { price: number | null; holders: number | null }) => {
  const copy = useCopy();
  const supply = useQuery({ queryKey: ["bridge-supply"], queryFn: fetchBridgeSupply, staleTime: 60_000 }).data;
  const grams = useQuery({ queryKey: ["gold-backing"], queryFn: fetchGoldBacking, staleTime: 300_000 }).data;
  const total = supply ? toNumber(supply.total, 8) : null;
  const tiles = [
    { l: "Total supply", v: total === null ? "—" : `${fmt(total, 1)} GLDT`, s: "on all networks" },
    { l: "Gold in Swiss vaults", v: grams === undefined ? "—" : `${fmt(grams / 1000, 2)} kg`, s: "100 GLDT = 1 gram" },
    {
      l: "Market cap",
      v: total === null || price === null ? "—" : usd(total * price).replace(/\.\d+$/, ""),
      s: price === null ? "" : `1 GLDT ≈ $${fmt(price, 2)}`,
    },
    { l: "Holders", v: holders === null ? "—" : fmt(holders), s: "on all networks" },
    { l: "Transfer fee", v: "0.1 GLDT", s: "on Internet Computer" },
    { l: "Decimals", v: "8", s: "on every network" },
  ];
  const nets = (["icp", "ethereum", "base"] as const).map((k) => {
    const v = supply ? toNumber(supply[k], 8) : 0;
    const pct = total ? (v / total) * 100 : 0;
    return { k, v, pct };
  });
  const contracts = [
    { k: "GLDT ledger", net: "icp" as const, v: GLDT_LEDGER_CANISTER_ID, href: `https://dashboard.internetcomputer.org/canister/${GLDT_LEDGER_CANISTER_ID}` },
    { k: "Bridge and NFT swaps", net: "icp" as const, v: SWAP_CANISTER_ID, href: `https://dashboard.internetcomputer.org/canister/${SWAP_CANISTER_ID}` },
    { k: "GLDT token", net: "ethereum" as const, v: GLDT_TOKEN, href: `https://etherscan.io/token/${GLDT_TOKEN}` },
    { k: "GLDT token", net: "base" as const, v: GLDT_TOKEN, href: `https://basescan.org/token/${GLDT_TOKEN}` },
  ];
  return (
    <div className="ex-wrap">
      <div className="ex-tiles six">
        {tiles.map((x) => (
          <div key={x.l} className="ex-tile">
            <div className="ex-tl">{x.l}</div>
            <div className="ex-tv">{x.v}</div>
            <div className="ex-ts">{x.s}</div>
          </div>
        ))}
      </div>
      <div className="ex-ig">
        <div className="ex-oc">
          <div className="ex-tlh">Supply per network</div>
          <div>
            {nets.map((n) => (
              <div key={n.k} className="ex-srow">
                <span className="ex-net">
                  <img src={NETS[n.k].logo} alt="" />
                  {NETS[n.k].name}
                </span>
                <span className="b">
                  {fmt(n.v, 1)} GLDT <span className="sub">{n.pct.toFixed(1)}%</span>
                </span>
                <span className="ex-bar2">
                  <span style={{ width: `${Math.max(1, n.pct).toFixed(1)}%` }} />
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="ex-oc">
          <div className="ex-tlh">Contracts</div>
          <div>
            {contracts.map((c) => (
              <div key={`${c.k}-${c.net}`} className="ex-crow">
                <div className="ex-cn">
                  <img src={NETS[c.net].logo} alt="" />
                  <div className="ex-ct">
                    <div className="b">{c.k}</div>
                    <div className="sub">{NETS[c.net].name}</div>
                  </div>
                </div>
                <div className="ex-iv">
                  <span className="mono">{c.v.startsWith("0x") ? `${c.v.slice(0, 6)}…${c.v.slice(-4)}` : `${c.v.slice(0, 5)}…${c.v.slice(-3)}`}</span>
                  <button type="button" className="ex-ib" aria-label="Copy" onClick={() => copy(c.v)}>
                    <Copy />
                  </button>
                  <a className="ex-ib" href={c.href} target="_blank" rel="noopener noreferrer" aria-label="Open">
                    <External />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
