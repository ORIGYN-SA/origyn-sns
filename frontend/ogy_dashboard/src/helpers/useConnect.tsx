import { useConnect as useConnect2ic } from "@connect2ic/react";
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

  const principalShort = _truncate(principal, { length: 26 });

  return {
    principal,
    principalShort,
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
