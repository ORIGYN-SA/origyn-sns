import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { useAtomValue, useSetAtom } from "jotai";

import "../styles/kit.css";
import gldtLogo from "../assets/gldt.svg";
import { wagmiConfig } from "../evm/config";
import {
  Close,
  Docs,
  Menu,
  NavBridge,
  NavWallet,
  ThemeDarkOff,
  ThemeDarkOn,
  ThemeLightOff,
  ThemeLightOn,
  ThemeSystemOff,
  ThemeSystemOn,
} from "../icons";
import { toastAtom, useIsPhone, useTheme } from "../lib/ui";
import { EvmAccount, IcpAccount } from "./AccountMenus";
import { EvmConnectDialog } from "./EvmConnectDialog";
import { transferRequestAtom } from "./state";

const PAGES = [
  { to: "/wallet", label: "Wallet", Icon: NavWallet },
  { to: "/bridge", label: "Bridge", Icon: NavBridge },
] as const;

const Brand = () => (
  <Link className="brand" to="/">
    <img src={gldtLogo} alt="GLDT logo" />
    <span className="brandtx">GLDT</span>
  </Link>
);

const ThemeSwitch = () => {
  const { choice, pick } = useTheme();
  const opts = [
    { k: "light", label: "Light theme", On: ThemeLightOn, Off: ThemeLightOff },
    { k: "dark", label: "Dark theme", On: ThemeDarkOn, Off: ThemeDarkOff },
    { k: "system", label: "System theme", On: ThemeSystemOn, Off: ThemeSystemOff },
  ] as const;
  return (
    <div className="ttw" role="group" aria-label="Theme">
      {opts.map(({ k, label, On, Off }) => (
        <button
          key={k}
          type="button"
          className={`th ${choice === k ? "on" : ""}`}
          aria-label={label}
          aria-pressed={choice === k}
          onClick={() => pick(k)}
        >
          {choice === k ? <On /> : <Off />}
        </button>
      ))}
    </div>
  );
};

const Toast = () => {
  const toast = useAtomValue(toastAtom);
  const [shown, setShown] = useState<{ id: number; message: string; out: boolean } | null>(null);
  useEffect(() => {
    if (!toast) return;
    setShown({ ...toast, out: false });
    const a = setTimeout(() => setShown((s) => s && { ...s, out: true }), 3000);
    const b = setTimeout(() => setShown(null), 3400);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [toast]);
  if (!shown) return null;
  return (
    <div className="toastw">
      {/* The key restarts the entrance animation for each new message. */}
      <div key={shown.id} className={`toast ${shown.out ? "out" : ""}`} role="status" aria-live="polite">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
          <circle cx="10" cy="10" r="10" fill="#61d345" />
          <path d="M6.2 10.4l2.5 2.5 5.1-5.6" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="square" />
        </svg>
        <div className="tmsg">{shown.message}</div>
      </div>
    </div>
  );
};

const PhoneMenu = ({ onClose }: { onClose: () => void }) => (
  <div className="msho" onClick={onClose}>
    <div className="mshb" />
    <div className="msh">
      <div className="mshin">
        <div className="mshc">
          <div className="mshh">
            <Brand />
            <button type="button" className="hb" onClick={onClose}>
              <span className="sr">Close main menu</span>
              <Close width={18} height={18} />
            </button>
          </div>
          {PAGES.map(({ to, label, Icon }) => (
            <NavLink key={to} className="mlink" to={to}>
              <Icon width={20} height={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Shell = () => {
  const phone = useIsPhone();
  const { applied } = useTheme();
  const [sheet, setSheet] = useState(false);
  const requestTransfer = useSetAtom(transferRequestAtom);
  const location = useLocation();
  useEffect(() => setSheet(false), [location.pathname]);

  return (
    <div className={`app ${phone ? "phone" : ""}`} data-theme={applied}>
      <div className="scr">
        <header className="top">
          <div className="toprow">
            <div style={{ flexShrink: 0 }}>
              <Brand />
            </div>
            <div className="tright">
              <EvmAccount />
              <IcpAccount onTransfer={() => requestTransfer((n) => n + 1)} />
              {phone && (
                <div>
                  <button type="button" className="hb" onClick={() => setSheet(true)}>
                    <span className="sr">Open main menu</span>
                    <Menu />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="wrap">
          <div className="card">
            {!phone && (
              <nav className="side" aria-label="Main">
                <div className="sidein">
                  {PAGES.map(({ to, label, Icon }) => (
                    <NavLink key={to} className={({ isActive }) => `nav ${isActive ? "on" : ""}`} to={to}>
                      <div className="nic">
                        <Icon />
                      </div>
                      <div className="nlb">{label}</div>
                    </NavLink>
                  ))}
                </div>
              </nav>
            )}
            <Outlet />
            <div className="tint" aria-hidden="true" />
          </div>
        </div>
        <footer className="bot">
          <div className="botin">
            <div>
              <ThemeSwitch />
            </div>
            <div className="botr">
              <a className="lu" href="https://origyn.gitbook.io" target="_blank" rel="noopener noreferrer">
                Docs
                <Docs />
              </a>
            </div>
          </div>
        </footer>
      </div>
      {sheet && <PhoneMenu onClose={() => setSheet(false)} />}
      <EvmConnectDialog />
      <Toast />
    </div>
  );
};

/** The GLDT app (Wallet and Bridge): the design's shell around the page, with the Ethereum wallet
 * connection next to the Internet Computer login. */
const AppLayout = () => (
  <WagmiProvider config={wagmiConfig}>
    <Shell />
  </WagmiProvider>
);

export default AppLayout;
