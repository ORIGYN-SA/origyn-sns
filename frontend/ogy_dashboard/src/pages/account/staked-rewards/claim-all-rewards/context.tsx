import { createContext, useContext, ReactNode, useState } from "react";
import { useWallet } from "@components/auth/useWallet";

import { useClaimRewards as useClaimRewardsService } from "@services/queries/sns-rewards/useClaimReward";
import { useT } from "@i18n/LocaleContext";

interface ClaimAllRewardsContextType {
  mutation: ReturnType<typeof useClaimRewardsService>;
  show: boolean;
  handleShow: () => void;
  handleClose: () => void;
  claimAmount: number;
  principal: string | undefined;
  neuronIds: string[];
  claimDisabledReason: string | undefined;
}

const ClaimAllRewardsContext = createContext<
  ClaimAllRewardsContextType | undefined
>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useClaimAllRewards = () => {
  const context = useContext(ClaimAllRewardsContext);
  if (!context) {
    throw new Error(
      "useClaimAllRewards must be used within a ClaimAllRewardsProvider"
    );
  }
  return context;
};

export const ClaimAllRewardsProvider = ({
  children,
  neuronIds,
  claimAmount,
}: {
  children: ReactNode;
  neuronIds: string[];
  claimAmount: number;
}) => {
  const t = useT();
  const { principalId, subAccount } = useWallet();
  const claimDisabledReason = subAccount
    ? t("account.rewards.claimDisabledReason")
    : undefined;
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const mutation = useClaimRewardsService();

  const handleClose = () => {
    setShow(false);
    mutation.reset();
  };

  return (
    <ClaimAllRewardsContext.Provider
      value={{
        mutation,
        show,
        handleShow,
        handleClose,
        neuronIds,
        claimAmount,
        principal: principalId,
        claimDisabledReason,
      }}
    >
      {children}
    </ClaimAllRewardsContext.Provider>
  );
};
