import { createContext, useContext, ReactNode, useState } from "react";
import { useWallet } from "@amerej/artemis-react";

import useFetchBalanceOGYLegacyOwner from "@hooks/accounts/useFetchBalanceOGYLegacyOwner";
import useSendTokens from "@services/queries/switch-ledger/useSendTokens";
import useRequestSwap from "@services/queries/switch-ledger/useRequestSwap";

interface SwapTokensContextType {
  sendTokens: ReturnType<typeof useSendTokens>;
  requestSwap: ReturnType<typeof useRequestSwap>;
  fetchBalanceLegacy: ReturnType<typeof useFetchBalanceOGYLegacyOwner>;
  show: boolean;
  handleShow: () => void;
  handleClose: () => void;
  principal: string | undefined;
  accountId: string | undefined;
}

const SwapTokensContext = createContext<SwapTokensContextType | undefined>(
  undefined
);

// eslint-disable-next-line react-refresh/only-export-components
export const useSwapTokens = () => {
  const context = useContext(SwapTokensContext);
  if (!context) {
    throw new Error("useSwapTokens must be used within a SwapTokensProvider");
  }
  return context;
};

export const SwapTokensProvider = ({ children }: { children: ReactNode }) => {
  const { principalId, accountId } = useWallet();
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const sendTokens = useSendTokens();
  const requestSwap = useRequestSwap();
  const fetchBalanceLegacy = useFetchBalanceOGYLegacyOwner();

  const handleClose = () => {
    setShow(false);
    sendTokens.reset();
    requestSwap.reset();
  };

  return (
    <SwapTokensContext.Provider
      value={{
        sendTokens,
        requestSwap,
        fetchBalanceLegacy,
        show,
        handleShow,
        handleClose,
        principal: principalId,
        accountId,
      }}
    >
      {children}
    </SwapTokensContext.Provider>
  );
};
