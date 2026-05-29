import { createContext, useContext, ReactNode, useState } from "react";
import { useWallet } from "@components/auth/useWallet";
import { useT } from "@i18n/LocaleContext";

import useFetchBalanceOGYLegacyOwner from "@hooks/accounts/useFetchBalanceOGYLegacyOwner";
import useSendTokens from "@services/queries/switch-ledger/useSendTokens";
import useRequestSwap from "@services/queries/switch-ledger/useRequestSwap";
import useIsWhitelisted from "@services/queries/switch-ledger/useIsWhitelisted";

interface SwapTokensContextType {
  sendTokens: ReturnType<typeof useSendTokens>;
  requestSwap: ReturnType<typeof useRequestSwap>;
  fetchBalanceLegacy: ReturnType<typeof useFetchBalanceOGYLegacyOwner>;
  show: boolean;
  handleShow: () => void;
  handleClose: () => void;
  principal: string | undefined;
  accountId: string | undefined;
  isWhitelisted: boolean | undefined;
  swapDisabledReason: string | undefined;
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
  const t = useT();
  const { principalId, accountId, subAccount, walletSelected } = useWallet();
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const sendTokens = useSendTokens();
  const requestSwap = useRequestSwap();
  const fetchBalanceLegacy = useFetchBalanceOGYLegacyOwner();
  // The swap canister has no ICRC-21 consent message, so OISY can't sign its
  // calls. Disable swap for OISY (also skips the is_caller_whitelisted query).
  const swapDisabledReason =
    walletSelected === "oisy"
      ? t("account.ledgerSwitch.swap.disabledOisy")
      : subAccount
        ? t("account.ledgerSwitch.swap.disabledSubAccount")
        : undefined;
  const { data: isWhitelisted } = useIsWhitelisted(
    principalId,
    !swapDisabledReason
  );

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
        isWhitelisted,
        swapDisabledReason,
      }}
    >
      {children}
    </SwapTokensContext.Provider>
  );
};
