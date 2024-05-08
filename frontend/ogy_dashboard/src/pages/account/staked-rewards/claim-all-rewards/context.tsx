import { createContext, useContext, ReactNode, useState } from "react";
import useClaimRewardService from "@services/sns-rewards/useClaimReward";
import { useQueryClient } from "@tanstack/react-query";
import useConnect from "@helpers/useConnect";

interface ClaimAllRewardsContextType {
  mutation: ReturnType<typeof useClaimRewardService>;
  show: boolean;
  handleShow: () => void;
  handleClose: () => void;
  claimAmount: number;
  handleClaimAllRewards: () => void;
  principal: string | undefined;
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
  const queryClient = useQueryClient();
  const { principal } = useConnect();
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
  const mutation = useClaimRewardService();

  const handleClaimAllRewards = () => {
    neuronIds.forEach((neuron) => {
      mutation.mutate(
        {
          neuronId: neuron,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["getNeuronsByOwner"] });
            queryClient.invalidateQueries({ queryKey: ["getNeuron"] });
            queryClient.invalidateQueries({
              queryKey: ["getNeuronClaimBalance"],
            });
          },
        }
      );
    });
  };

  return (
    <ClaimAllRewardsContext.Provider
      value={{
        mutation,
        show,
        handleShow,
        handleClose,
        handleClaimAllRewards,
        claimAmount,
        principal,
      }}
    >
      {children}
    </ClaimAllRewardsContext.Provider>
  );
};
