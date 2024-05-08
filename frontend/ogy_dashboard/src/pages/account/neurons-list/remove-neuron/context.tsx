import { createContext, useContext, ReactNode, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useRemoveNeuronService from "@services/sns-rewards/useRemoveNeuronOwnership";
interface RemoveNeuronContextType {
  mutation: ReturnType<typeof useRemoveNeuronService>;
  show: boolean;
  handleShow: () => void;
  handleClose: () => void;
  neuronId: string;
  handleRemoveNeuronOwnership: () => void;
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

export const RemoveNeuronProvider = ({
  children,
  neuronId,
}: {
  children: ReactNode;
  neuronId: string;
}) => {
  const queryClient = useQueryClient();
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
  const mutation = useRemoveNeuronService();

  const handleRemoveNeuronOwnership = () => {
    const { mutate: removeNeuron } = mutation;
    removeNeuron(
      {
        neuronId: { id: [...Uint8Array.from(Buffer.from(neuronId, "hex"))] },
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
  };

  return (
    <RemoveNeuronContext.Provider
      value={{
        mutation,
        show,
        handleShow,
        handleClose,
        neuronId,
        handleRemoveNeuronOwnership,
      }}
    >
      {children}
    </RemoveNeuronContext.Provider>
  );
};
