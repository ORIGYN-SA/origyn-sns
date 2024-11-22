import { createContext, useContext, ReactNode, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
interface RemoveNeuronContextType {
  show: boolean;
  handleShow: () => void;
  handleClose: () => void;
  handleRemoveNeuron: () => void;
}

const RemoveNeuronContext = createContext<RemoveNeuronContextType | undefined>(
  undefined
);

// eslint-disable-next-line react-refresh/only-export-components
export const useRemoveNeuron = () => {
  const context = useContext(RemoveNeuronContext);
  if (!context) {
    throw new Error(
      "useRemoveNeuron must be used within a RemoveNeuronProvider"
    );
  }
  return context;
};

export const RemoveNeuronProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  const handleRemoveNeuron = () => {
    queryClient.invalidateQueries({
      queryKey: ["userGetNeuronsByOwner"],
    });
    queryClient.invalidateQueries({
      queryKey: ["getNeuronClaimBalance"],
    });
    handleClose();
  };

  return (
    <RemoveNeuronContext.Provider
      value={{
        show,
        handleShow,
        handleClose,
        handleRemoveNeuron,
      }}
    >
      {children}
    </RemoveNeuronContext.Provider>
  );
};
