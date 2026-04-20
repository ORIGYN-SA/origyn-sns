import { Button, Dialog, LoaderSpin } from "@components/ui";
import { useWallet } from "@components/auth/useWallet";
import { isPlugInstalled, PLUG_INSTALL_URL } from "@components/auth/plug";

const Auth = ({
  label = "Connect",
  className = "!px-[25px] !py-0 text-[14px] leading-[48px]",
}: {
  label?: string;
  className?: string;
}) => {
  const {
    state,
    isConnected,
    handleOpenWalletList,
    handleSelectWallet,
    handleDisconnectWallet,
    walletState,
    handleCloseWalletList,
    walletList,
  } = useWallet();

  const showConnectingDialog = state === walletState.Connecting;

  return (
    <>
      {!isConnected && (
        <Button className={className} onClick={handleOpenWalletList}>
          {label}
        </Button>
      )}
      {isConnected && (
        <Button onClick={handleDisconnectWallet}>Disconnect</Button>
      )}
      <Dialog
        show={state === walletState.OpenWalletList}
        handleClose={handleCloseWalletList}
      >
        <div className="pt-2 pb-8 px-6 mx-auto w-full max-w-[343px]">
          <div className="mb-6 text-center text-[18px] font-bold leading-none text-content">
            Connect your wallet
          </div>
          <div className="flex flex-col gap-2">
            {walletList.map(({ id, icon, name }) => {
              const plugMissing = id === "plug" && !isPlugInstalled();
              const className =
                "flex items-center gap-3 w-full rounded-full bg-[#F9FAFE] border border-[#E1E1E1] py-1 pl-1 pr-4 hover:bg-[#F1F3F9] transition-colors";
              const inner = (
                <>
                  <div className="flex items-center justify-center w-[39px] h-[39px] rounded-full bg-white border border-[#E1E1E1] shrink-0 overflow-hidden">
                    <img
                      src={icon}
                      alt=""
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <span className="text-[14px] font-semibold leading-none text-content">
                    {name}
                  </span>
                  {plugMissing && (
                    <span className="ml-auto text-[12px] font-medium text-muted">
                      Install
                    </span>
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
                  onClick={() => handleSelectWallet(id)}
                  key={id}
                  className={className}
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      </Dialog>
      <Dialog
        show={showConnectingDialog}
        handleClose={handleCloseWalletList}
      >
        <div className="pt-6 pb-12 px-4 text-center">
          <div className="mb-8 font-semibold text-lg">Connecting...</div>
          <div className="flex items-center justify-center">
            <LoaderSpin />
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default Auth;
