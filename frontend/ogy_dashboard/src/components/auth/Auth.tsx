import { useState } from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button, Dialog, LoaderSpin } from "@components/ui";
import { useWallet } from "@components/auth/useWallet";
import { isPlugInstalled, PLUG_INSTALL_URL } from "@components/auth/plug";
import { useT } from "@i18n/LocaleContext";

const Auth = ({
  label,
  className = "!px-[25px] !py-0 text-[14px] leading-[48px]",
}: {
  label?: string;
  className?: string;
}) => {
  const t = useT();
  const {
    isConnected,
    isConnecting,
    handleOpenWalletList,
    handleDisconnectWallet,
  } = useWallet();

  const handleShowWalletList = () => {
    handleOpenWalletList();
  };

  return (
    <>
      {!isConnected && (
        <Button
          className={className}
          onClick={handleShowWalletList}
          disabled={isConnecting}
          aria-busy={isConnecting}
        >
          {label ?? t("auth.connect")}
        </Button>
      )}
      {isConnected && (
        <Button onClick={handleDisconnectWallet}>{t("auth.disconnect")}</Button>
      )}
    </>
  );
};

export const AuthDialogs = () => {
  const t = useT();
  const {
    state,
    handleSelectWallet,
    walletState,
    handleCloseWalletList,
    walletList,
    connectError,
    sessionExpired,
    isRestoring,
    handleReconnect,
    handleDisconnectWallet,
  } = useWallet();
  const [connectingDialogDismissed, setConnectingDialogDismissed] =
    useState(false);

  // Suppress during restore: IdentityKit reports "connecting" while it rehydrates
  // a saved session, which isn't a user-initiated connect.
  const showConnectingDialog =
    state === walletState.Connecting &&
    !isRestoring &&
    !connectingDialogDismissed;

  const handleCloseConnectingDialog = () => {
    setConnectingDialogDismissed(true);
  };

  return (
    <>
      <Dialog
        show={state === walletState.OpenWalletList}
        handleClose={handleCloseWalletList}
        panelClassName="max-w-[360px] rounded-[20px] bg-surface-1 border border-border-strong shadow-2xl"
        floatingClose
      >
        <div className="pt-10 pb-6 px-5 mx-auto w-full max-w-[360px] flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4">
            <img src="/ogy_logo.svg" alt="" className="h-9 w-auto" />
            <div className="flex flex-col items-center gap-1.5">
              <div className="text-[22px] font-semibold leading-none text-content">
                {t("auth.connectWallet.title")}
              </div>
              <div className="text-[13px] leading-none text-muted">
                {t("auth.connectWallet.subtitle")}
              </div>
            </div>
          </div>
          {connectError && (
            <div
              role="alert"
              className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] leading-snug text-red-400"
            >
              {connectError}
            </div>
          )}
          <div className="flex flex-col gap-2">
            {walletList.map(({ id, icon, name }) => {
              const plugMissing = id === "plug" && !isPlugInstalled();
              const className =
                "group flex items-center gap-4 w-full rounded-full bg-surface-muted border border-border-strong p-2 pr-4 hover:bg-surface-2 hover:border-border-strong transition-colors";
              const inner = (
                <>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-1 border border-border-strong shrink-0 overflow-hidden">
                    <img src={icon} alt="" className="w-6 h-6 object-contain" />
                  </div>
                  <span className="flex-1 text-start text-[14px] font-semibold leading-none text-content">
                    {name}
                  </span>
                  {plugMissing ? (
                    <span className="text-[12px] font-medium text-muted">
                      {t("auth.install")}
                    </span>
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-muted shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-content rtl:-scale-x-100" />
                  )}
                </>
              );
              if (plugMissing) {
                return (
                  <a
                    key={id}
                    href={PLUG_INSTALL_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={className}
                  >
                    {inner}
                  </a>
                );
              }
              return (
                <button
                  type="button"
                  onClick={() => {
                    setConnectingDialogDismissed(false);
                    handleSelectWallet(id);
                  }}
                  key={id}
                  className={className}
                >
                  {inner}
                </button>
              );
            })}
          </div>
          <div className="text-center text-[12px] leading-none text-muted">
            {t("auth.newToIc")}{" "}
            <a
              href="https://internetcomputer.org/internet-identity"
              target="_blank"
              rel="noreferrer"
              className="text-content font-medium hover:underline"
            >
              {t("auth.learnMore")}
            </a>
          </div>
        </div>
      </Dialog>
      <Dialog
        show={showConnectingDialog}
        handleClose={handleCloseConnectingDialog}
        panelClassName="max-w-[360px] rounded-[20px] bg-surface-1 border border-border-strong shadow-2xl"
        floatingClose
      >
        <div className="pt-10 pb-10 px-5 mx-auto w-full max-w-[360px] flex flex-col items-center gap-5">
          <LoaderSpin />
          <div className="flex flex-col items-center gap-1.5">
            <div className="text-[18px] font-semibold leading-none text-content">
              {t("auth.connecting.title")}
            </div>
            <div className="text-[13px] leading-none text-muted">
              {t("auth.connecting.subtitle")}
            </div>
          </div>
        </div>
      </Dialog>
      <Dialog
        show={sessionExpired}
        handleClose={handleDisconnectWallet}
        panelClassName="max-w-[360px] rounded-[20px] bg-surface-1 border border-border-strong shadow-2xl"
        floatingClose
      >
        <div className="pt-10 pb-6 px-5 mx-auto w-full max-w-[360px] flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4">
            <img src="/ogy_logo.svg" alt="" className="h-9 w-auto" />
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="text-[22px] font-semibold leading-none text-content">
                {t("auth.sessionExpired.title")}
              </div>
              <div className="text-[13px] leading-snug text-muted">
                {t("auth.sessionExpired.description")}
              </div>
            </div>
          </div>
          <Button className="w-full" onClick={handleReconnect}>
            {t("auth.reconnect")}
          </Button>
        </div>
      </Dialog>
    </>
  );
};

export default Auth;
