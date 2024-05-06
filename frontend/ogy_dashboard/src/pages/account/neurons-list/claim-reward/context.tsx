// contexts/ClaimRewardContext.tsx
import { createContext, useContext, ReactNode, useState } from "react";
import { useForm } from "@tanstack/react-form";
import useClaimRewardService from "@services/sns-rewards/useClaimReward";
import type { FormApi } from "@tanstack/react-form";

interface ClaimRewardContextType {
  form: FormApi<
    {
      id: string;
    },
    undefined
  >;
  mutation: ReturnType<typeof useClaimRewardService>;
  show: boolean;
  handleShow: () => void;
  handleClose: () => void;
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

export const ClaimRewardProvider = ({ children }: { children: ReactNode }) => {
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
  const mutation = useClaimRewardService();

  const handleClaimReward = ({ id }: { id: string }) => {
    mutation.mutate({
      id,
    });
  };

  const form = useForm({
    defaultValues: {
      id: "",
    },
    onSubmit: async ({ value }) => {
      handleClaimReward({ id: value.id });
    },
  });

  return (
    <ClaimRewardContext.Provider
      value={{ form, mutation, show, handleShow, handleClose }}
    >
      {children}
    </ClaimRewardContext.Provider>
  );
};
