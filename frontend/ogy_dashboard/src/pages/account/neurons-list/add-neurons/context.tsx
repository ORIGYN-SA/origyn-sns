// contexts/AddNeuronContext.tsx
import { createContext, useContext, ReactNode, useState } from "react";
import { useForm } from "@tanstack/react-form";
import useAddNeuronOwnership from "@services/sns-rewards/useAddNeuronOwnership";
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
  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
  const mutation = useAddNeuronOwnership();

  const handleAddNeuron = ({ neuronId }: { neuronId: string }) => {
    mutation.mutate({
      neuronId,
    });
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
