// import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "artemis-react";
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
      >
        <div className="pt-6 pb-12 px-4">
          <div>
            {walletList.map(({ id, icon, name, adapter }, i: number) => (
              <div
                onClick={() => handleSelectWallet(id)}
                key={i}
                className="flex flex-col justify-center items-center mb-6 cursor-pointer"
              >
                <div className="grid grid-cols-7 text-left">
                  <div className="col-start-2 col-end-3">
                    <img
                      src={icon}
                      alt=""
                      width="32px"
                      height="32px"
                      className="rounded-full"
                    />
                  </div>
                  <div className="col-span-1"></div>
                  <div className="col-span-4">
                    <div className="font-semibold">{name}</div>
                    <div className="text-content/60">{adapter.readyState}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Dialog>
      <Dialog
        show={state == walletState.Connecting}
        enableClose={false}
        handleClose={() => null}
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
