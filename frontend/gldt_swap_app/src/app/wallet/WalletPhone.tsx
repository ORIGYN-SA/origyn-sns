import { useState } from "react";
import { useNavigate } from "react-router-dom";

import nftLogo from "../assets/gold-nft.svg";
import { ActBity, ActBridge, ActBurn, ActMint, ActTransfer, Chevron, CopySm } from "../icons";
import { COLLECTIONS, type Collection, type CollectionKey } from "../icp/canisters";
import { useGoldPrice, useNftHistory } from "../data/wallet";
import { fmt, shortDate, toNumber } from "../lib/format";
import { useCopy } from "../lib/ui";
import { ActionButton } from "./Hero";
import { NET_INFO, SYM_INFO, decimalsOf, digitsOf, priceOf, type WalletData, type WalletToken } from "./model";
import { kindIcon, nftName } from "./rows";
import { TokenRows } from "./TokenList";
import type { TxRow, TxView } from "./TxList";
import { Dialog } from "../shell/Dialog";

type Fungible = Exclude<WalletToken, { kind: "nft" }>;

const Placeholder = () => (
  <div className="wp-ph">
    {[0, 1].map((i) => (
      <div key={i}>
        <div className="wp-phr">
          <div className="wp-phi">
            <div className="wp-phl">
              <div className="phc wp-c20" />
              <div className="phb wp-b20" />
            </div>
            <div className="phb wp-b20" />
          </div>
        </div>
      </div>
    ))}
    <div className="fade96 fadebg" />
  </div>
);

const cut = (a: string): [string, string] => (a.startsWith("0x") ? [a.slice(0, 6), a.slice(-4)] : [a.slice(0, 6), a.slice(-6)]);

/** A transaction as a phone card: the other side's address, the date and the amount. */
const TxCard = ({
  kind,
  other,
  at,
  credit,
  amount,
  usd,
}: {
  kind: TxRow["kind"];
  other: string | null;
  at: number;
  credit: boolean;
  amount: string;
  usd: string;
}) => {
  const copy = useCopy();
  const [a, b] = other ? cut(other) : ["Minting account", ""];
  return (
    <div className="txm">
      <div className="txg">
        <div className="kic">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={kindIcon(kind, credit)} />
          </svg>
        </div>
        <div className="txb">
          <div className="txk">{kind}</div>
          <div className="txs">
            <div className="adr">
              <div className="adri">
                <span className="a1">{a}</span>
                {b && <span className="a2">…</span>}
                {b && <span className="a3">{b}</span>}
              </div>
            </div>
            {other && (
              <button type="button" className="cpb" aria-label="Copy address" onClick={() => copy(other)}>
                <CopySm className="c60" />
              </button>
            )}
            <span className="txd">· {shortDate(at)}</span>
          </div>
        </div>
      </div>
      <div className="txv">
        <div className={`txa ${credit ? "ok" : "err"}`}>{amount}</div>
        <div className="txu">{usd}</div>
      </div>
    </div>
  );
};

const TokenPill = ({ t, data, onOpen, disabled }: { t: WalletToken; data: WalletData; onOpen: () => void; disabled: boolean }) => {
  const goldUsd = useGoldPrice().data ?? null;
  if (t.kind === "nft") {
    return (
      <div className="wp-pillw">
        <button type="button" className="mtok" disabled={disabled} onClick={onOpen}>
          <div className="wp-pilli n">
            <div className="wp-g4">
              <img className="wp-i24" src={nftLogo} alt="GOLD NFT logo" />
              <div className="f6 t18">GLD NFT</div>
            </div>
            <div className="t14 c60">{goldUsd === null ? "" : `1 g ≈ $${fmt(goldUsd)}`}</div>
          </div>
          <Chevron />
        </button>
      </div>
    );
  }
  const sym = t.kind === "icp" ? t.sym : t.token.sym;
  const net = t.kind === "icp" ? "icp" : t.token.net;
  const price = priceOf(data.prices, t);
  return (
    <div className="wp-pillw">
      <button type="button" className="mtok" disabled={disabled} onClick={onOpen}>
        <div className="wp-pilli">
          <div className="wp-g4">
            <span className="glg md">
              <img className="wp-i24" src={SYM_INFO[sym].img} alt={SYM_INFO[sym].alt} />
              {(sym === "GLDT" || t.kind === "evm") && (
                <span className="gnet">
                  <img src={NET_INFO[net].logo} alt="" />
                </span>
              )}
            </span>
            <div className="wp-sym">
              <div className="f6 t18">{sym}</div>
              {t.kind === "evm" && <div className="f4 t14 c60 wp-net">on {NET_INFO[net].name}</div>}
            </div>
          </div>
          <div className="t14 c60">{price === null ? "" : "$" + fmt(price, 2)}</div>
        </div>
        <Chevron />
      </button>
    </div>
  );
};

/** The phone layout of a fungible token: balance, the token pill, actions and the history cards. */
const TokenView = ({
  t,
  data,
  tx,
  onPick,
  onTransfer,
  onBurn,
}: {
  t: Fungible;
  data: WalletData;
  tx: TxView;
  onPick: () => void;
  onTransfer: () => void;
  onBurn: () => void;
}) => {
  const navigate = useNavigate();
  const sym = t.kind === "icp" ? t.sym : t.token.sym;
  const price = priceOf(data.prices, t);
  const b = data.balOf(t);
  const units = b.kind === "ready" ? toNumber(b.units, decimalsOf(t)) : 0;
  const pulse = b.kind === "loading" ? "pulse" : "";
  const connected = b.kind !== "off";
  const usdV = price === null ? null : units * price;
  const anyWallet = data.icpIn || !!data.evmAddress;
  return (
    <>
      <div className="gcard" style={{ padding: "16px", position: "relative" }}>
        <div className="wp-col">
          <div className="wp-pb32">
            <div className="wp-col">
              <div>
                <div className="wp-col">
                  <div className={pulse}>
                    <div className="wp-balrow t30">
                      <div className="f6">{b.kind === "unavailable" ? "—" : fmt(units, digitsOf(t))}</div>
                      <div className="c60">{sym}</div>
                    </div>
                  </div>
                  <div className={pulse}>
                    <div className="t18">
                      {sym === "GLDT" ? (
                        <>
                          {fmt(units / 100)} grams of Gold <span className="c60">{usdV === null ? "" : `($${fmt(usdV)})`}</span>
                        </>
                      ) : (
                        <div className="c60">{usdV === null ? "" : "$" + fmt(usdV)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <TokenPill t={t} data={data} onOpen={onPick} disabled={!anyWallet} />
          </div>
        </div>
        <div className="vbabs">
          <div className="vbrow">
            <ActionButton label="Transfer" icon={<ActTransfer />} disabled={!connected} onClick={onTransfer} />
            {sym === "GLDT" && (
              <div className="wp-vba">
                <ActionButton label="Bridge" icon={<ActBridge />} disabled={!connected} onClick={() => navigate("/bridge")} />
              </div>
            )}
            {sym === "GLDT" && t.kind === "icp" && <ActionButton label="Burn" icon={<ActBurn />} disabled={!connected} onClick={onBurn} />}
          </div>
        </div>
      </div>
      <div className="wp-sec">
        <div className="wp-mb16">Transactions</div>
        {tx.state === "off" && <Placeholder />}
        {tx.state === "loading" && <div>Loading...</div>}
        {tx.state === "external" && (
          <div className="emptyb">
            <div>
              The history of {sym} is on{" "}
              <a className="gold" href={tx.href} target="_blank" rel="noopener noreferrer">
                {tx.scan}
              </a>
            </div>
          </div>
        )}
        {tx.state === "unavailable" && (
          <div className="emptyb">
            <div>Transactions can't be shown right now</div>
          </div>
        )}
        {tx.state === "ready" && tx.rows.length === 0 && (
          <div className="emptyb">
            <div>No transactions found</div>
          </div>
        )}
        {tx.state === "ready" && tx.rows.length > 0 && (
          <div className="wp-txl">
            {tx.rows.map((r) => {
              const credit = r.to !== null && tx.me.some((m) => m.toLowerCase() === r.to?.toLowerCase());
              return (
                <TxCard
                  key={r.key}
                  kind={r.kind}
                  other={credit ? r.from : r.to}
                  at={r.at}
                  credit={credit}
                  amount={`${credit ? "+" : "−"}${fmt(r.amount, digitsOf(t))} ${sym}`}
                  usd={price === null ? "" : "$" + fmt(r.amount * price)}
                />
              );
            })}
            <div />
            <div className="wp-foot">
              <div>
                <div>No more transactions found</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const NftTxCards = ({ c, me, goldUsd }: { c: Collection; me: string; goldUsd: number | null }) => {
  const q = useNftHistory(c);
  if (q.isLoading) return <div>Loading...</div>;
  const rows = q.data ?? [];
  if (q.isError || rows.length === 0)
    return (
      <div className="emptyb">
        <div>{q.isError ? "Transactions can't be shown right now" : "No transactions found"}</div>
      </div>
    );
  return (
    <div className="wp-txl">
      {rows.map((r) => {
        const credit = r.to === me;
        return (
          <TxCard
            key={String(r.id)}
            kind="Transfer"
            other={credit ? r.from : r.to}
            at={r.at}
            credit={credit}
            amount={c.weight}
            usd={goldUsd === null ? "" : "$" + fmt(c.grams * goldUsd)}
          />
        );
      })}
      <div />
      <div className="wp-foot">
        <div>
          <div>No more transactions found</div>
        </div>
      </div>
    </div>
  );
};

/** The phone layout of the GLD NFTs: count and grams, the pill, actions, NFTs and their history. */
const NftViewPhone = ({
  data,
  onPick,
  onTransfer,
  onMint,
  onBurn,
  onOpen,
}: {
  data: WalletData;
  onPick: () => void;
  onTransfer: () => void;
  onMint: () => void;
  onBurn: () => void;
  onOpen: (c: Collection, id: bigint) => void;
}) => {
  const [tab, setTab] = useState<0 | 1>(0);
  const [ctab, setCtab] = useState<CollectionKey>("1G");
  const [pill, setPill] = useState<CollectionKey>("1G");
  const goldUsd = useGoldPrice().data ?? null;
  const held = data.nfts.data;
  const count = held ? COLLECTIONS.reduce((n, c) => n + held[c.key].length, 0) : 0;
  const disc = !data.icpIn;
  const me = data.icp?.kind === "signedIn" ? data.icp.principal.toText() : "";
  const c = COLLECTIONS.find((x) => x.key === ctab) ?? COLLECTIONS[0];
  const pc = COLLECTIONS.find((x) => x.key === pill) ?? COLLECTIONS[0];
  const own = held?.[ctab] ?? [];
  const pulse = data.icpIn && data.nfts.isLoading ? "pulse" : "";
  return (
    <>
      <div className="gcard" style={{ padding: "16px", position: "relative" }}>
        <div className="wp-col">
          <div className="wp-pb32">
            <div className="wp-col">
              <div>
                <div className="wp-col">
                  <div className={pulse}>
                    <div className="wp-balrow t30">
                      <div className="f6">{count}</div>
                      <div className="c60 f4">NFTs</div>
                    </div>
                  </div>
                  <div className={pulse}>
                    <div className="t18">
                      <span>{data.nftGrams} grams of Gold </span>
                      <span className="c60">{goldUsd === null ? "" : `($${fmt(data.nftGrams * goldUsd)})`}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <TokenPill t={{ kind: "nft" }} data={data} onOpen={onPick} disabled={disc} />
          </div>
        </div>
        <div className="vbabs">
          <div className="vbrow">
            <ActionButton label="Transfer" icon={<ActTransfer />} disabled={disc} onClick={onTransfer} />
            <ActionButton label="Mint" icon={<ActMint />} disabled={disc} onClick={onMint} />
            <ActionButton label="Burn" icon={<ActBurn />} disabled={disc} onClick={onBurn} />
            <div className="wp-vba">
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
      <div className="wp-sec wp-clip">
        <div className="wp-tabs" role="tablist">
          <button type="button" className={`tab ${tab === 0 ? "on" : ""}`} role="tab" aria-selected={tab === 0} onClick={() => setTab(0)}>
            My NFTs
          </button>
          <button type="button" className={`tab ${tab === 1 ? "on" : ""}`} role="tab" aria-selected={tab === 1} onClick={() => setTab(1)}>
            Transactions
          </button>
        </div>
        {tab === 0 && (
          <div>
            <div className="wp-ctabs" role="tablist">
              {COLLECTIONS.map((x) => (
                <button
                  key={x.key}
                  type="button"
                  className={`ctab ${ctab === x.key ? "on" : ""}`}
                  role="tab"
                  aria-selected={ctab === x.key}
                  onClick={() => setCtab(x.key)}
                >
                  <div className="wp-ctc">
                    <div className="wp-chip">{held ? held[x.key].length : 0}</div>
                    <div className="wp-barbox">
                      <img className="wp-bar48" src={x.img} alt="" />
                    </div>
                    <div>{x.key}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="wp-mt32">
              {disc || data.nfts.isLoading ? (
                <div>Loading...</div>
              ) : own.length === 0 ? (
                <div className="emptyb">
                  <div>No NFTs found</div>
                </div>
              ) : (
                <div className="wp-grid">
                  {own.map((id) => (
                    <div key={String(id)} className="nftc" onClick={() => onOpen(c, id)}>
                      <img className="wp-cimg" src={c.img} alt={nftName(c, id)} />
                      <div className="tc wp-tc">{nftName(c, id)}</div>
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
              <div className="wp-pills" role="tablist">
                {COLLECTIONS.map((x) => (
                  <button
                    key={x.key}
                    type="button"
                    className={`pill ${pill === x.key ? "on" : ""}`}
                    role="tab"
                    aria-selected={pill === x.key}
                    onClick={() => setPill(x.key)}
                  >
                    {x.key}
                  </button>
                ))}
              </div>
              <div className="wp-mt12">
                <NftTxCards c={pc} me={me} goldUsd={goldUsd} />
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

/** The phone Wallet: one token at a time, chosen from a sheet. */
export const WalletPhone = ({
  data,
  selected,
  tx,
  onSelect,
  onTransfer,
  onNftTransfer,
  onSwap,
  onOpenNft,
  onConnect,
}: {
  data: WalletData;
  selected: WalletToken;
  tx: TxView;
  onSelect: (t: WalletToken) => void;
  onTransfer: (t: Fungible) => void;
  onNftTransfer: () => void;
  onSwap: (mode: "mint" | "burn") => void;
  onOpenNft: (c: Collection, id: bigint) => void;
  onConnect: (net: "icp" | "ethereum" | "base") => void;
}) => {
  const [sheet, setSheet] = useState(false);
  return (
    <div className="inner">
      <section className="lp" aria-label="Wallet">
        <div className="t36 f6 gold" style={{ textAlign: "center" }}>
          Wallet
        </div>
      </section>
      <section className="rp">
        {selected.kind === "nft" ? (
          <NftViewPhone
            data={data}
            onPick={() => setSheet(true)}
            onTransfer={onNftTransfer}
            onMint={() => onSwap("mint")}
            onBurn={() => onSwap("burn")}
            onOpen={onOpenNft}
          />
        ) : (
          <TokenView
            t={selected}
            data={data}
            tx={tx}
            onPick={() => setSheet(true)}
            onTransfer={() => onTransfer(selected)}
            onBurn={() => onSwap("burn")}
          />
        )}
      </section>
      {sheet && (
        <Dialog label="Wallet" title={null} onClose={() => setSheet(false)}>
          <div className="wp-sell">
            <TokenRows
              data={data}
              selected={selected}
              onPick={(t) => {
                onSelect(t);
                setSheet(false);
              }}
              onConnect={(net) => {
                setSheet(false);
                onConnect(net);
              }}
            />
          </div>
        </Dialog>
      )}
    </div>
  );
};
