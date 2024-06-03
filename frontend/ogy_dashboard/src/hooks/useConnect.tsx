import { useEffect, useState } from "react";
import { useConnect as useConnect2ic } from "@amerej/connect2ic-react";
import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";

const useConnect = () => {
  const {
    principal,
    activeProvider,
    status,
    isInitializing,
    isConnected,
    isConnecting,
    isDisconnecting,
    isIdle,
    connect,
    cancelConnect,
    disconnect,
  } = useConnect2ic();

  const [accountId, setAccountId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (principal) {
      setAccountId(
        AccountIdentifier.fromPrincipal({
          principal: Principal.fromText(principal as string),
        }).toHex()
      );
    }
  }, [principal]);

  return {
    principal,
    accountId,
    activeProvider,
    status,
    isInitializing,
    isConnected,
    isConnecting,
    isDisconnecting,
    isIdle,
    connect,
    cancelConnect,
    disconnect,
  };
};

export default useConnect;
