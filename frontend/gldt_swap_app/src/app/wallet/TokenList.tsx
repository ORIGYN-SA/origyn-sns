import { useState } from "react";

import nftLogo from "../assets/gold-nft.svg";
import { Chevron } from "../icons";
import { EVM_TOKENS, type EvmNet, type EvmTokenSym } from "../evm/chains";
import { fmt } from "../lib/format";
import {
  NET_INFO,
  SYM_INFO,
  balText,
  priceOf,
  priceText,
  tokenKey,
  usdShort,
  type WalletData,
  type WalletToken,
} from "./model";

type Props = {
  data: WalletData;
  selected: WalletToken;
  onPick: (t: WalletToken) => void;
  onConnect: (net: "icp" | EvmNet) => void;
};

/** One token on one network inside a group (GLDT on Ethereum, ...). */
const SubRow = ({ t, net, data, selected, onPick, onConnect }: Props & { t: WalletToken; net: "icp" | EvmNet }) => {
  const sym = t.kind === "icp" ? t.sym : t.kind === "evm" ? t.token.sym : "GLDT";
  const b = data.balOf(t);
  const live = b.kind !== "off";
  const { bal, usd } = balText(b, t, priceOf(data.prices, t));
  return (
    <div
      className={`gsub ${tokenKey(t) === tokenKey(selected) ? "on" : ""}`}
      onClick={() => (live ? onPick(t) : onConnect(net))}
    >
      <div className="tokin">
        <div className="tokl">
          <span className="glg sm">
            <img src={SYM_INFO[sym].img} alt={SYM_INFO[sym].alt} />
            <span className="gnet">
              <img src={NET_INFO[net].logo} alt="" />
            </span>
          </span>
          <div className="gtx">
            <div className="t14">{sym}</div>
            <div className="t12 f4 c60">on {NET_INFO[net].name}</div>
          </div>
        </div>
        {live ? (
          <div className="tokr">
            <div className="t14">{bal}</div>
            <div className="t12 c60">{usd}</div>
          </div>
        ) : (
          <button
            type="button"
            className="maxb"
            onClick={(e) => {
              e.stopPropagation();
              onConnect(net);
            }}
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

/** A token held on several networks: one header with the total, and a row per network. */
const Group = ({
  sym,
  members,
  open,
  onToggle,
  ...p
}: Props & {
  sym: "GLDT" | "ETH" | "USDC";
  members: { t: WalletToken; net: "icp" | EvmNet }[];
  open: boolean;
  onToggle: () => void;
}) => {
  const price = priceOf(p.data.prices, members[0].t);
  let total = 0;
  let loading = false;
  for (const { t } of members) {
    const b = p.data.balOf(t);
    if (b.kind === "loading") loading = true;
    if (b.kind === "ready") total += Number(b.units) / 10 ** (t.kind === "evm" ? t.token.decimals : 8);
  }
  const digits = sym === "ETH" ? 6 : 2;
  const holdsSelected = members.some(({ t }) => tokenKey(t) === tokenKey(p.selected));
  return (
    <div className={`tgrp ${!open && holdsSelected ? "on" : ""}`}>
      <button type="button" className="tgh" aria-expanded={open} onClick={onToggle}>
        <div className="tokin">
          <div className="tokl">
            <span className="glg">
              <img src={SYM_INFO[sym].img} alt={SYM_INFO[sym].alt} />
              <span className="gcnt">{members.length}</span>
            </span>
            <div>
              <div>
                {sym}
                <span className="gpr">{priceText(price)}</span>
              </div>
              <div className="c60 t14 f4">{SYM_INFO[sym].label}</div>
            </div>
          </div>
          <div className="tokr">
            <div>{loading ? "Loading..." : fmt(total, digits)}</div>
            <div className="c60 t14">{loading ? "Loading..." : price === null ? "" : usdShort(total * price)}</div>
          </div>
        </div>
      </button>
      {open && (
        <div className="gsl">
          {members.map(({ t, net }) => (
            <SubRow key={tokenKey(t)} t={t} net={net} {...p} />
          ))}
        </div>
      )}
      <button type="button" className="gtog" aria-expanded={open} onClick={onToggle}>
        {open ? "Hide networks" : `Show ${members.length} networks`}
        <Chevron className={open ? "rot180" : ""} />
      </button>
    </div>
  );
};

const evmMembers = (sym: EvmTokenSym) =>
  EVM_TOKENS.filter((x) => x.sym === sym).map((token) => ({ t: { kind: "evm", token } as WalletToken, net: token.net }));

/** A token on one network only: the GLD NFTs, ICP, USDT on Ethereum. */
const Single = ({
  t,
  label,
  badge,
  extra,
  ...p
}: Props & { t: WalletToken; label: string; badge?: EvmNet; extra?: { bal: string; usd: string } }) => {
  const sym = t.kind === "icp" ? t.sym : t.kind === "evm" ? t.token.sym : null;
  const price = priceOf(p.data.prices, t);
  const text = extra ?? balText(p.data.balOf(t), t, price);
  const on = tokenKey(t) === tokenKey(p.selected);
  return (
    <div className={`tok ${t.kind === "nft" ? "nft" : ""} ${on ? "on" : ""}`} onClick={() => p.onPick(t)}>
      <div className="tokin">
        <div className="tokl">
          <span className="glg">
            <img src={sym ? SYM_INFO[sym].img : nftLogo} alt={sym ? SYM_INFO[sym].alt : "GOLD NFT logo"} />
            {badge && (
              <span className="gnet">
                <img src={NET_INFO[badge].logo} alt="" />
              </span>
            )}
          </span>
          <div>
            <div>
              {sym ?? "GLD NFT"}
              {sym && <span className="gpr">{priceText(price)}</span>}
            </div>
            <div className="c60 t14 f4">{label}</div>
          </div>
        </div>
        <div className="tokr">
          <div>{text.bal}</div>
          <div className="c60 t14">{text.usd}</div>
        </div>
      </div>
    </div>
  );
};

/** The token rows: GLDT on every network, the GLD NFTs and ICP, then the Ethereum and Base tokens. */
export const TokenRows = (p: Props) => {
  const [open, setOpen] = useState({ GLDT: true, ETH: false, USDC: false });
  const toggle = (k: keyof typeof open) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const { data } = p;
  const evmOn = !!data.evmAddress;
  const nftBal = data.balOf({ kind: "nft" });
  const gramsUsd = data.prices.GLDT === null ? "" : ` - $${fmt(data.nftGrams * 100 * data.prices.GLDT)}`;
  const nftText =
    nftBal.kind === "ready"
      ? { bal: String(nftBal.units), usd: `${data.nftGrams} grams${gramsUsd}` }
      : nftBal.kind === "loading"
        ? { bal: "Loading...", usd: "Loading..." }
        : { bal: "—", usd: "" };
  const usdt = EVM_TOKENS.find((x) => x.sym === "USDT");
  return (
    <div className="tlist">
      <Group
        sym="GLDT"
        open={open.GLDT}
        onToggle={() => toggle("GLDT")}
        members={[{ t: { kind: "icp", sym: "GLDT" }, net: "icp" }, ...evmMembers("GLDT")]}
        {...p}
      />
      {data.icpIn && (
        <>
          <Single t={{ kind: "nft" }} label="Gold NFT" extra={nftText} {...p} />
          <Single t={{ kind: "icp", sym: "ICP" }} label="Internet Computer" {...p} />
        </>
      )}
      {evmOn && (
        <>
          <Group sym="ETH" open={open.ETH} onToggle={() => toggle("ETH")} members={evmMembers("ETH")} {...p} />
          <Group sym="USDC" open={open.USDC} onToggle={() => toggle("USDC")} members={evmMembers("USDC")} {...p} />
          {usdt && <Single t={{ kind: "evm", token: usdt }} label="Tether USD" badge="ethereum" {...p} />}
        </>
      )}
    </div>
  );
};

/** The Tokens box of the desktop Wallet, with a placeholder until a wallet is connected. */
export const TokenList = (p: Props) => (
  <div className="tbox">
    <div className="tboxh">Tokens</div>
    {p.data.icpIn || p.data.evmAddress ? (
      <TokenRows {...p} />
    ) : (
        <div className="w-wld">
        {[0, 1].map((i) => (
          <div key={i}>
            <div className="w-wph">
              <div className="w-phi">
                <div className="w-phg">
                  <div className="phc w-o40" />
                  <div className="w-phc">
                    <div className="phb w-h5 w-q16" />
                    <div className="phb w-h4 w-q20" />
                  </div>
                </div>
                <div className="w-phr">
                  <div className="phb w-h5 w-q20" />
                  <div className="phb w-h4 w-q16" />
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="fade96 fades1" />
      </div>
    )}
  </div>
);
