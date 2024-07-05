// import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "artemis-react";
import { Button, Dialog } from "@components/ui";

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
      {!isConnected && (
        <Button className="" onClick={handleOpenWalletList}>
          Connect
        </Button>
      )}
      {isConnected && (
        <Button className="" onClick={handleDisconnectWallet}>
          Disconnect
        </Button>
      )}
      <Dialog
        show={state == walletState.OpenWalletList}
        handleClose={handleCloseWalletList}
      >
        <div className="pt-6 pb-12 px-4 text-center">
          <div>
            {walletList.map(({ id, icon, name, adapter }, i: number) => (
              <div onClick={() => handleSelectWallet(id)} key={i}>
                <div>
                  <img src={icon} alt="" width="32px" height="32px" />
                </div>
                <div>
                  <div> {name}</div>
                  <div>{adapter.readyState}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default Auth;
