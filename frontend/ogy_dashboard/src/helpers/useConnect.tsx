import { useEffect, useState } from "react";
import { useConnect as useConnect2ic } from "@connect2ic/react";
import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import _truncate from "lodash/truncate";

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

  const [principalShort, setPrincipalShort] = useState("");
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (principal) {
      setPrincipalShort(_truncate(principal, { length: 26 }));
      setAccountId(
        AccountIdentifier.fromPrincipal({
          principal: Principal.fromText(principal as string),
        }).toHex()
      );
    }
  }, [principal]);

  return {
    principal,
    principalShort,
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
