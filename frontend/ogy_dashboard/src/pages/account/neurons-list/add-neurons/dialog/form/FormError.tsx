import { Button } from "@components/ui";
import { useAddNeuron } from "../../context";

const FormError = () => {
  const { form, mutation, handleClose } = useAddNeuron();
  const { reset: resetForm } = form;
  const { reset: resetMutation, error } = mutation;

  const handleClick = () => {
    resetForm();
    resetMutation();
  };

  const handleOnClose = () => {
    resetForm();
    resetMutation();
    handleClose();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-red-500 font-semibold">Adding neuron error!</div>
      <div className="mt-1 mb-8">{error?.message}</div>
      <div className="flex items-center">
        <Button className="mr-2" onClick={handleOnClose}>
          Close
        </Button>
        <Button onClick={handleClick}>Retry</Button>
      </div>
    </div>
  );
};

export default FormError;
