// import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@amerej/artemis-react";
import { Button, Dialog, LoaderSpin } from "@components/ui";

const Auth = () => {
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

  return (
    <>
      {!isConnected && <Button onClick={handleOpenWalletList}>Connect</Button>}
      {isConnected && (
        <Button onClick={handleDisconnectWallet}>Disconnect</Button>
      )}
      <Dialog
        show={state == walletState.OpenWalletList}
        handleClose={handleCloseWalletList}
        size="sm"
      >
        <div className="pt-6 pb-12 px-12">
          <div className="mb-8 text-center text-lg font-semibold">
            Connect Wallet
          </div>
          <div>
            {walletList.map(
              ({ id, icon, name }, i: number) =>
                !["stoic", "metamask"].includes(id) && (
                  <div
                    onClick={() => handleSelectWallet(id)}
                    key={i}
                    className="mb-3 cursor-pointer border-border border rounded-full"
                  >
                    <div className="flex items-center">
                      <div className="w-[48px] h-[48px] flex items-center bg-surface-2/40 dark:bg-surface-2 rounded-full p-2">
                        <img src={icon} alt="" className="rounded-full" />
                      </div>
                      <div className="ml-8">{name}</div>
                    </div>
                  </div>
                )
            )}
          </div>
        </div>
      </Dialog>
      <Dialog
        show={state == walletState.Connecting}
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
