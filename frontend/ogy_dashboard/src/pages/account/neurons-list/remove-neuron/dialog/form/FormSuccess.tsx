import { Button } from "@components/ui";
import { useRemoveNeuron } from "../../context";

const FormSuccess = () => {
  const { mutation, handleClose } = useRemoveNeuron();
  const { reset: resetMutation } = mutation;

  const handleOnClose = () => {
    resetMutation();
    handleClose();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-jade font-semibold">
        Neuron ownership removed successfully!
      </div>
      <Button onClick={handleOnClose}>Close</Button>
    </div>
  );
};

export default FormSuccess;
