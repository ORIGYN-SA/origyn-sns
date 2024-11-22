import { createContext, useContext, ReactNode, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
interface AddNeuronContextType {
  show: boolean;
  handleShow: () => void;
  handleClose: () => void;
  handleAddNeuron: () => void;
}

const AddNeuronContext = createContext<AddNeuronContextType | undefined>(
  undefined
);

// eslint-disable-next-line react-refresh/only-export-components
export const useAddNeuron = () => {
  const context = useContext(AddNeuronContext);
  if (!context) {
    throw new Error("useAddNeuron must be used within a AddNeuronProvider");
  }
  return context;
};

export const AddNeuronProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  const handleAddNeuron = () => {
    queryClient.invalidateQueries({
      queryKey: ["userGetNeuronsByOwner"],
    });
    queryClient.invalidateQueries({
      queryKey: ["getNeuronClaimBalance"],
    });
    handleClose();
  };

  return (
    <AddNeuronContext.Provider
      value={{ show, handleShow, handleClose, handleAddNeuron }}
    >
      {children}
    </AddNeuronContext.Provider>
  );
};
