import { Link } from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";

import { useAuth } from "@auth/index";
import ethLogo from "../assets/eth.png";
import { Chevron, Copy, External, Logout, Transfer, User } from "../icons";
import { NETS } from "../evm/chains";
import { useClosing, useCopy, useIsPhone } from "../lib/ui";
import { useEvmDialog } from "./state";

/** A long id shown as its first and last characters, as the design's `.adr` block. */
export const Adr = ({
  text,
  head,
  tail,
  size,
}: {
  text: string;
  head: number;
  tail: number;
  size?: "xs" | "md" | "lg";
}) => (
  <span className={`adr ${size ?? ""}`}>
    <span className="adri">
      <span className="a1">{text.slice(0, head)}</span>
      <span className="a2">…</span>
      <span className="a3">{text.slice(-tail)}</span>
    </span>
  </span>
);

/** The account pill of the Internet Computer login, or the Connect Wallet button. */
export const IcpAccount = ({ onTransfer }: { onTransfer: () => void }) => {
  const { isConnected, principalId, connect, disconnect } = useAuth();
  const phone = useIsPhone();
  const menu = useClosing(100);
  const copy = useCopy();
  if (!isConnected) {
    return (
      <button type="button" className="btn" onClick={connect}>
        Connect Wallet
      </button>
    );
  }
  const open = menu.open && !menu.out;
  return (
    <div className="umw">
      <div className="umc">
        <div className={`dim ${open ? "on" : ""}`} onClick={menu.close} />
        <div className="umrel">
          <button
            type="button"
            className="um"
            onClick={menu.toggle}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span className="umin">
              <User />
              {phone ? (
                <Adr text={principalId} head={4} tail={4} />
              ) : (
                <Adr text={principalId} head={12} tail={12} size="lg" />
              )}
            </span>
            <Chevron className={open ? "rot180" : ""} />
          </button>
          {menu.open && (
            <div className={`menu ${menu.out ? "out" : ""}`} role="menu" aria-label="Account">
              <button
                type="button"
                className="mi cp tip"
                role="menuitem"
                data-tip={principalId}
                onClick={() => copy(principalId)}
              >
                <Copy />
                Copy address
              </button>
              <div className="sep" />
              <Link
                className="mi"
                role="menuitem"
                to="/wallet"
                onClick={() => {
                  menu.close();
                  onTransfer();
                }}
              >
                <Transfer />
                Transfer
              </Link>
              <div className="sep" />
              <Link
                className="mi"
                role="menuitem"
                to={`/explorer?q=${encodeURIComponent(principalId)}`}
                onClick={menu.close}
              >
                <External />
                View in explorer
              </Link>
              <div className="sep" />
              <div
                className="mi lo"
                role="menuitem"
                onClick={() => {
                  menu.close();
                  disconnect();
                }}
              >
                <Logout />
                Log out
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** The Ethereum wallet pill, or the button that opens the Connect Ethereum Wallet dialog. */
export const EvmAccount = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const dialog = useEvmDialog();
  const phone = useIsPhone();
  const menu = useClosing(100);
  const copy = useCopy();
  if (!isConnected || !address) {
    return (
      <div className="umw evw">
        <button
          type="button"
          className="um"
          onClick={dialog.open}
          aria-label={phone ? "Connect Ethereum Wallet" : undefined}
        >
          <span className="umin">
            <img className="umlg" src={ethLogo} alt="" />
            {phone ? "Connect" : "Connect Ethereum Wallet"}
          </span>
        </button>
      </div>
    );
  }
  const open = menu.open && !menu.out;
  return (
    <div className="umw evw">
      <div className="umc">
        <div className={`dim ${open ? "on" : ""}`} onClick={menu.close} />
        <div className="umrel">
          <button
            type="button"
            className="um"
            onClick={menu.toggle}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span className="umin">
              <img className="umlg" src={ethLogo} alt="Ethereum wallet" />
              {!phone && <Adr text={address} head={6} tail={4} />}
            </span>
            <Chevron className={open ? "rot180" : ""} />
          </button>
          {menu.open && (
            <div className={`menu evm ${menu.out ? "out" : ""}`} role="menu" aria-label="Ethereum wallet">
              <button
                type="button"
                className="mi cp tip"
                role="menuitem"
                data-tip={address}
                onClick={() => copy(address)}
              >
                <Copy />
                Copy address
              </button>
              {(["ethereum", "base"] as const).map((net) => (
                <div key={net}>
                  <div className="sep" />
                  <a
                    className="mi"
                    role="menuitem"
                    href={`${NETS[net].scan}/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <External />
                    View on {NETS[net].scanName}
                  </a>
                </div>
              ))}
              <div className="sep" />
              <div
                className="mi lo"
                role="menuitem"
                onClick={() => {
                  menu.close();
                  disconnect();
                }}
              >
                <Logout />
                Disconnect
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
