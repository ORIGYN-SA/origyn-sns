import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { ActBridge, ActBurn, ActMint, ActTransfer } from "../icons";
import { fmt, toNumber } from "../lib/format";
import { NET_INFO, SYM_INFO, decimalsOf, digitsOf, priceOf, type WalletData, type WalletToken } from "./model";

export const ActionButton = ({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  disabled: boolean;
  onClick: () => void;
}) => (
  <button type="button" className="vbtn" disabled={disabled} onClick={onClick}>
    <div className="vbi">
      {icon}
      <div className="vbl">{label}</div>
    </div>
  </button>
);

/** The selected token's card: its name and price, the balance, and Transfer, Bridge, Burn (GLDT on
 * ICP), which swaps GLDT for a GLD NFT, and Mint (GLDT on Ethereum or Base), which swaps GLD NFTs for
 * GLDT there. */
export const Hero = ({
  t,
  data,
  onTransfer,
  onBurn,
  onMint,
}: {
  t: Exclude<WalletToken, { kind: "nft" }>;
  data: WalletData;
  onTransfer: () => void;
  onBurn: () => void;
  onMint: () => void;
}) => {
  const navigate = useNavigate();
  const sym = t.kind === "icp" ? t.sym : t.token.sym;
  const net = t.kind === "icp" ? "icp" : t.token.net;
  const isGldt = sym === "GLDT";
  const price = priceOf(data.prices, t);
  const b = data.balOf(t);
  const units = b.kind === "ready" ? toNumber(b.units, decimalsOf(t)) : 0;
  const usdV = price === null ? null : units * price;
  const connected = b.kind !== "off";
  const loading = b.kind === "loading" ? "pulse" : "";
  return (
    <div className="gcard" style={{ padding: "32px", position: "relative" }}>
      <div className="w-col">
        <div className="w-hpb">
          <div className="w-col">
            <div className="w-thp">
              <div className="w-col">
                <div className="w-thr">
                  <span className="glg md">
                    <img src={SYM_INFO[sym].img} alt={SYM_INFO[sym].alt} />
                    {(isGldt || t.kind === "evm") && (
                      <span className="gnet">
                        <img src={NET_INFO[net].logo} alt="" />
                      </span>
                    )}
                  </span>
                  <div className="f6 t20">{sym}</div>
                  {(isGldt || t.kind === "evm") && <div className="f4 t20 c60">on {NET_INFO[net].name}</div>}
                </div>
                <div className="t14 c60">
                  <div className={price === null ? "pulse" : ""}>
                    1 {sym} ≈ ${price === null ? "0" : fmt(price, 5)}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="w-col">
                <div className={loading}>
                  <div className="w-tcb t36">
                    <div className="f6">{b.kind === "unavailable" ? "—" : fmt(units, digitsOf(t))}</div>
                    <div className="c60">{sym}</div>
                  </div>
                </div>
                <div className={loading}>
                  <div className="t18">
                    {isGldt ? (
                      <span>
                        {fmt(units / 100)} grams of Gold{" "}
                        {usdV !== null && <span className="c60">(${fmt(usdV)})</span>}
                      </span>
                    ) : (
                      <div className="c60">{usdV === null ? "" : "$" + fmt(usdV)}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="vbabs">
        <div className="vbrow">
          <ActionButton label="Transfer" icon={<ActTransfer />} disabled={!connected} onClick={onTransfer} />
          {isGldt && (
            <div className="w-vba">
              <ActionButton label="Bridge" icon={<ActBridge />} disabled={!connected} onClick={() => navigate("/bridge")} />
            </div>
          )}
          {isGldt && t.kind === "icp" && (
            <ActionButton label="Burn" icon={<ActBurn />} disabled={!connected} onClick={onBurn} />
          )}
          {/* The NFTs are on the Internet Computer, so Mint needs that login. */}
          {isGldt && t.kind === "evm" && <ActionButton label="Mint" icon={<ActMint />} disabled={!data.icpIn} onClick={onMint} />}
        </div>
      </div>
    </div>
  );
};
