// contexts/AddNeuronContext.tsx
import { createContext, useContext, ReactNode, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import useAddNeuronOwnership from "@services/queries/sns-rewards/useAddNeuronOwnership";
import type { FormApi } from "@tanstack/react-form";

interface AddNeuronContextType {
  form: FormApi<
    {
      neuronId: string;
    },
    undefined
  >;
  mutation: ReturnType<typeof useAddNeuronOwnership>;
  show: boolean;
  handleShow: () => void;
  handleClose: () => void;
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
  const mutation = useAddNeuronOwnership();

  const handleAddNeuron = ({ neuronId }: { neuronId: string }) => {
    
    queryClient.invalidateQueries({
      queryKey: ["userGetNeuronsByOwner"],
    });
    queryClient.invalidateQueries({ queryKey: ["userListNeuronsAll"] });
    queryClient.invalidateQueries({
      queryKey: ["getNeuronClaimBalance"],
    });

    setShow(false)
  };

  const handleClose = () => {
    setShow(false);
    mutation.reset();
  };

  const form = useForm({
    defaultValues: {
      neuronId: "",
    },
    onSubmit: async ({ value }) => {
      handleAddNeuron({ neuronId: value.neuronId });
    },
  });

  return (
    <AddNeuronContext.Provider
      value={{ form, mutation, show, handleShow, handleClose }}
    >
      {children}
    </AddNeuronContext.Provider>
  );
};
