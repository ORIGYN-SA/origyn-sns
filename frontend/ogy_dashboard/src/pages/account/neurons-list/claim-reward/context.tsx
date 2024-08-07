import { createContext, useContext, ReactNode, useState } from "react";
import { useWallet } from "@amerej/artemis-react";
import useClaimRewardService from "@services/queries/sns-rewards/useClaimReward";
interface ClaimRewardContextType {
  mutation: ReturnType<typeof useClaimRewardService>;
  show: boolean;
  handleShow: () => void;
  handleClose: () => void;
  neuronId: string;
  claimAmount: number;
  principal: string | undefined;
}

const ClaimRewardContext = createContext<ClaimRewardContextType | undefined>(
  undefined
);

// eslint-disable-next-line react-refresh/only-export-components
export const useClaimReward = () => {
  const context = useContext(ClaimRewardContext);
  if (!context) {
    throw new Error("useClaimReward must be used within a ClaimRewardProvider");
  }
  return context;
};

export const ClaimRewardProvider = ({
  children,
  neuronId,
  claimAmount,
}: {
  children: ReactNode;
  neuronId: string;
  claimAmount: number;
}) => {
  const { principalId } = useWallet();
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const mutation = useClaimRewardService();

  const handleClose = () => {
    setShow(false);
    mutation.reset();
  };

  return (
    <ClaimRewardContext.Provider
      value={{
        mutation,
        show,
        handleShow,
        handleClose,
        neuronId,
        claimAmount,
        principal: principalId,
      }}
    >
      {children}
    </ClaimRewardContext.Provider>
  );
};
