import { useState } from "react";

import nftLogo from "../assets/gold-nft.svg";
import { ActBity, ActBurn, ActMint, ActTransfer, ArrowDown, CopySm } from "../icons";
import { COLLECTIONS, type Collection, type CollectionKey } from "../icp/canisters";
import { useGoldPrice, useNftHistory } from "../data/wallet";
import { fmt, shortDate } from "../lib/format";
import { useCopy } from "../lib/ui";
import { ActionButton } from "./Hero";
import { kindIcon } from "./TxList";
import type { WalletData } from "./model";

export const nftName = (c: Collection, id: bigint) => `GLD NFT ${c.key} #${id}`;

const Placeholder = () => (
  <div className="w-tph">
    {[0, 1].map((i) => (
      <div key={i}>
        <div className="w-tpr">
          <div className="w-phi">
            <div className="w-phg">
              <div className="phc w-o20" />
              <div className="phb w-h5 w-q20" />
            </div>
            <div className="phb w-h5 w-q20" />
          </div>
        </div>
      </div>
    ))}
    <div className="fade96 fadebg" />
  </div>
);

const cut = (a: string): [string, string] => [a.slice(0, 12), a.slice(-12)];

const Addr = ({ text }: { text: string | null }) => {
  const copy = useCopy();
  const full = text ?? "Minting account";
  const [a, b] = text ? cut(text) : [full, ""];
  return (
    <div className="w-tcn">
      <span className="adr lg tip" data-tip={full}>
        <span className="adri">
          <span className="a1">{a}</span>
          {b && <span className="a2">…</span>}
          {b && <span className="a3">{b}</span>}
        </span>
        {text && (
          <button type="button" className="cpb" aria-label="Copy" onClick={() => copy(text)}>
            <CopySm />
          </button>
        )}
      </span>
    </div>
  );
};

const NftTxs = ({ c, me, goldUsd }: { c: Collection; me: string; goldUsd: number | null }) => {
  const q = useNftHistory(c);
  if (q.isLoading) return <div>Loading...</div>;
  if (q.isError)
    return (
      <div className="emptyb">
        <div>Transactions can't be shown right now</div>
      </div>
    );
  const rows = q.data ?? [];
  if (rows.length === 0)
    return (
      <div className="emptyb">
        <div>No transactions found</div>
      </div>
    );
  return (
    <div className="w-txl">
      {rows.map((r) => (
        <div key={String(r.id)}>
          <div className="txr">
            <div className="txg w-txk">
              <div className="kic">
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={kindIcon("Transfer", r.to === me)} />
                </svg>
              </div>
              <div className="txb">
                <div className="txk">Transfer</div>
                <div className="txs">
                  <span className="txd">{shortDate(r.at)}</span>
                </div>
              </div>
            </div>
            <div className="t14 w-txm">
              <div className="w-txln">
                <Addr text={r.from} />
                <div className="w-fc">
                  <ArrowDown className="rotm90" />
                </div>
                <Addr text={r.to} />
              </div>
            </div>
            <div className="txv">
              <div className="txa">{c.weight}</div>
              <div className="txu">{goldUsd === null ? "" : "$" + fmt(c.grams * goldUsd)}</div>
            </div>
          </div>
        </div>
      ))}
      <div />
      <div className="w-txf">
        <div>
          <div>No more transactions found</div>
        </div>
      </div>
    </div>
  );
};

/** The GLD NFT card and its two tabs: the NFTs held, by collection, and their transfers. */
export const NftView = ({
  data,
  onTransfer,
  onMint,
  onBurn,
  onOpen,
}: {
  data: WalletData;
  onTransfer: () => void;
  onMint: () => void;
  onBurn: () => void;
  onOpen: (c: Collection, id: bigint) => void;
}) => {
  const [tab, setTab] = useState<0 | 1>(0);
  const [ctab, setCtab] = useState<CollectionKey>("1G");
  const [pill, setPill] = useState<CollectionKey>("1G");
  const gold = useGoldPrice();
  const goldUsd = gold.data ?? null;
  const held = data.nfts.data;
  const count = held ? COLLECTIONS.reduce((n, c) => n + held[c.key].length, 0) : 0;
  const disc = !data.icpIn;
  const me = data.icp?.kind === "signedIn" ? data.icp.principal.toText() : "";
  const c = COLLECTIONS.find((x) => x.key === ctab) ?? COLLECTIONS[0];
  const pc = COLLECTIONS.find((x) => x.key === pill) ?? COLLECTIONS[0];
  const own = held?.[ctab] ?? [];
  const loading = data.icpIn && data.nfts.isLoading ? "pulse" : "";
  return (
    <>
      <div className="gcard" style={{ padding: "32px", position: "relative" }}>
        <div className="w-col">
          <div className="w-hpb">
            <div className="w-col">
              <div className="w-thp">
                <div className="w-col">
                  <div className="w-thr">
                    <img src={nftLogo} alt="GOLD NFT logo" />
                    <div className="f6 t20">GLD NFT</div>
                  </div>
                  <div className="t14 c60">
                    1 gram Gold ≈ <span>{goldUsd === null ? "" : "$" + fmt(goldUsd)}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="w-col">
                  <div className={loading}>
                    <div className="w-tcb t36">
                      <div className="f6">{count}</div>
                      <div className="c60 f4">NFTs</div>
                    </div>
                  </div>
                  <div className={loading}>
                    <div className="t18">
                      <span>{data.nftGrams} grams of Gold</span>{" "}
                      <span className="c60">{goldUsd === null ? "" : `($${fmt(data.nftGrams * goldUsd)})`}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="vbabs">
          <div className="vbrow">
            <ActionButton label="Transfer" icon={<ActTransfer />} disabled={disc} onClick={onTransfer} />
            <ActionButton label="Mint" icon={<ActMint />} disabled={disc} onClick={onMint} />
            <ActionButton label="Burn" icon={<ActBurn />} disabled={disc} onClick={onBurn} />
            <div className="w-vba">
              <ActionButton
                label="Buy on BITY"
                icon={<ActBity />}
                disabled={disc}
                onClick={() => window.open("https://gold.bity.com/", "_blank", "noopener,noreferrer")}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="w-sec">
        <div>
          <div className="w-stl" role="tablist" aria-label="GLD NFT">
            <button type="button" role="tab" className={`tab ${tab === 0 ? "on" : ""}`} aria-selected={tab === 0} onClick={() => setTab(0)}>
              My NFTs
            </button>
            <button type="button" role="tab" className={`tab ${tab === 1 ? "on" : ""}`} aria-selected={tab === 1} onClick={() => setTab(1)}>
              Transactions
            </button>
          </div>
          <div>
            {tab === 0 && (
              <div>
                <div className="w-ctl" role="tablist" aria-label="Collections">
                  {COLLECTIONS.map((x) => (
                    <button
                      key={x.key}
                      type="button"
                      role="tab"
                      className={`ctab ${ctab === x.key ? "on" : ""}`}
                      aria-selected={ctab === x.key}
                      onClick={() => setCtab(x.key)}
                    >
                      <div className="w-cti">
                        <div className="w-chip">{held ? held[x.key].length : 0}</div>
                        <div className="w-cim">
                          <img src={x.img} alt="" />
                        </div>
                        <div>{x.key}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="w-mt32">
                  {disc || data.nfts.isLoading ? (
                    <div>Loading...</div>
                  ) : own.length === 0 ? (
                    <div className="emptyb">
                      <div>No NFTs found</div>
                    </div>
                  ) : (
                    <div className="w-grid">
                      {own.map((id) => (
                        <div key={String(id)} className="nftc" onClick={() => onOpen(c, id)}>
                          <img className="w-cimg" src={c.img} alt={nftName(c, id)} />
                          <div className="w-ctr">{nftName(c, id)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {tab === 1 &&
              (disc ? (
                <Placeholder />
              ) : (
                <div>
                  <div className="w-pls" role="tablist" aria-label="Collections">
                    {COLLECTIONS.map((x) => (
                      <button
                        key={x.key}
                        type="button"
                        role="tab"
                        className={`pill ${pill === x.key ? "on" : ""}`}
                        aria-selected={pill === x.key}
                        onClick={() => setPill(x.key)}
                      >
                        {x.key}
                      </button>
                    ))}
                  </div>
                  <div className="w-mt12">
                    <NftTxs c={pc} me={me} goldUsd={goldUsd} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};
