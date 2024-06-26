import { createContext, useContext, ReactNode, useState } from "react";
import useClaimRewardService from "@services/queries/sns-rewards/useClaimReward";
import useConnect from "@hooks/useConnect";

interface ClaimAllRewardsContextType {
  mutation: ReturnType<typeof useClaimRewardService>;
  show: boolean;
  handleShow: () => void;
  handleClose: () => void;
  claimAmount: number;
  principal: string | undefined;
  neuronIds: string[];
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
  const { principal } = useConnect();
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const mutation = useClaimRewardService();

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
        principal,
      }}
    >
      {children}
    </ClaimAllRewardsContext.Provider>
  );
};
