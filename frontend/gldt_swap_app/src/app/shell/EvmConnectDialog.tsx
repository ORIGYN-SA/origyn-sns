import { useState } from "react";
import { useAtom } from "jotai";
import { useConnect } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";

import wcLogo from "../assets/walletconnect.svg";
import { WALLETCONNECT_READY } from "../evm/config";
import { Browser } from "../icons";
import { useToast } from "../lib/ui";
import { Dialog } from "./Dialog";
import { evmDialogAtom } from "./state";

type Pick = "browser" | "wc";

/** Connect Ethereum Wallet: a browser wallet (MetaMask, Rabby, Coinbase Wallet) or WalletConnect. */
export const EvmConnectDialog = () => {
  const [isOpen, setOpen] = useAtom(evmDialogAtom);
  const [busy, setBusy] = useState<Pick | null>(null);
  const { connectors, connectAsync } = useConnect();
  const toast = useToast();

  const pick = async (which: Pick) => {
    if (busy) return;
    const connector = connectors.find((c) =>
      which === "browser" ? c.type === injected.type : c.type === walletConnect.type
    );
    // The injected connector exists even with no wallet installed; only a provider makes it work.
    const noBrowserWallet = which === "browser" && !("ethereum" in window);
    if (!connector || noBrowserWallet) {
      toast(
        which === "browser"
          ? "No browser wallet found. Install MetaMask, Rabby or Coinbase Wallet."
          : "WalletConnect isn't set up on this site yet."
      );
      return;
    }
    setBusy(which);
    try {
      await connectAsync({ connector });
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      // A wallet closed by the user is not an error worth a message.
      if (!/reject|denied|closed/i.test(msg)) toast("The wallet did not connect. Try again.");
    } finally {
      setBusy(null);
    }
  };

  if (!isOpen) return null;
  return (
    <Dialog label="Connect Ethereum Wallet" size="md" onClose={() => setOpen(false)}>
      <div className="tlist ewl">
        <button type="button" className="tok" onClick={() => pick("browser")}>
          <div className="tokin">
            <div className="tokl">
              <span className="ewi">
                <Browser width={20} height={20} />
              </span>
              <div className="ewt">
                <div>Browser wallet</div>
                <div className="c60 t14 f4">MetaMask, Rabby, Coinbase Wallet</div>
              </div>
            </div>
            {busy === "browser" && <span className="spin xs" />}
          </div>
        </button>
        <button type="button" className="tok" onClick={() => pick("wc")}>
          <div className="tokin">
            <div className="tokl">
              <span className="ewi">
                <img src={wcLogo} alt="WalletConnect logo" />
              </span>
              <div className="ewt">
                <div>WalletConnect</div>
                <div className="c60 t14 f4">
                  {WALLETCONNECT_READY ? "Scan with a mobile wallet" : "Not available yet"}
                </div>
              </div>
            </div>
            {busy === "wc" && <span className="spin xs" />}
          </div>
        </button>
      </div>
    </Dialog>
  );
};
